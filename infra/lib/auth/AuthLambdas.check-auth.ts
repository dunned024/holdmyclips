import { CloudFrontRequestResult } from "aws-lambda"
import { createHash, randomBytes } from "crypto"
import { safeBase64Stringify } from "./util/base64"
import { createRequestHandler, redirectTo, staticPage } from "./util/cloudfront"
import { Config } from "./util/config"
import { extractAndParseCookies } from "./util/cookies"
import { decodeIdToken, IdTokenPayload, validate } from "./util/jwt"
import { createNonceHmac, generateNonce } from "./util/nonce"

export const handler = createRequestHandler(async (config, event) => {
  const request = event.Records[0].cf.request
  const domainName = request.headers["host"][0].value
  
  let uploadTargetUri = undefined;
  if (request.method === 'GET' && request.uri === '/uploadclip') {
    const filename = validateUploadFilename(request.querystring) // ensure filename is in querystring and has a value
    config.logger.info({filename})
    if (filename === undefined) {
      return staticPage({
        title: "Invalid filename",
        statusCode: "400",
        message: "The provided filename is invalid.",
        details:
          "The filename parameter was not provided or not assigned a value.",
        linkHref: `https://${domainName}${config.signOutPath}`,  // TODO: generalize staticPage
        linkText: "Sign out",
      })
    }
    uploadTargetUri = constructUploadTargetUri(filename)
    config.logger.info("uploadTargetUri:", uploadTargetUri)
  }

  const requestedUri = `${request.uri}${
    request.querystring ? "?" + request.querystring : ""
  }`

  const { idToken, refreshToken, nonce, nonceHmac } = extractAndParseCookies(
    request.headers,
    config.clientId,
  )
  config.logger.debug("Extracted cookies:", {
    idToken,
    refreshToken,
    nonce,
    nonceHmac,
  })

  if (!idToken) {
    return redirectToSignIn({ config, domainName, requestedUri: uploadTargetUri ? "/" : requestedUri })
  }

  // If the ID token has expired or expires in less than 10 minutes
  // and there is a refreshToken: refresh tokens.
  // This is done by redirecting the user to the refresh endpoint.
  // After the tokens are refreshed the user is redirected back here
  // (probably without even noticing this double redirect).
  const idTokenPayload = decodeIdToken(idToken)
  const { exp } = idTokenPayload
  config.logger.debug("ID token exp:", exp, new Date(exp * 1000).toISOString())
  if (Date.now() / 1000 > exp - 60 * 10 && refreshToken) {
    return redirectToRefresh({ config, domainName, requestedUri: uploadTargetUri ?? requestedUri })
  }

  // Check that the ID token is valid.
  config.logger.info("Validating JWT")
  const validateResult = await validate(
    idToken,
    config.tokenJwksUri,
    config.tokenIssuer,
    config.clientId,
  )

  if (validateResult !== undefined) {
    config.logger.debug("ID token not valid:", validateResult.validationError)
    return redirectToSignIn({ config, domainName, requestedUri: uploadTargetUri ? "/" : requestedUri })
  }

  config.logger.info("JWT is valid")

  if (!isAuthorized(config, idTokenPayload)) {
    return staticPage({
      title: "Not authorized",
      statusCode: "403",
      message: "You are not authorized for this resource.",
      details:
        "Your sign in was successful, but your user is not allowed to access this resource.",
      linkHref: `https://${domainName}${config.signOutPath}`,
      linkText: "Sign out",
    })
  }
  
  request.uri = uploadTargetUri ?? requestedUri;
  return request
})

/**
 * Check if the user is authorized to access the resource.
 */
export function isAuthorized(config: Config, idToken: IdTokenPayload): boolean {
  if (config.requireGroupAnyOf) {
    const inGroups = idToken["cognito:groups"] || []
    if (!config.requireGroupAnyOf.some((group) => inGroups.includes(group))) {
      return false
    }
  }

  return true
}

function redirectToRefresh({
  config,
  domainName,
  requestedUri,
}: {
  config: Config
  domainName: string
  requestedUri: string
}): CloudFrontRequestResult {
  config.logger.info("Redirecting to refresh endpoint")
  const nonce = generateNonce()
  const qs = new URLSearchParams({
    requestedUri,
    nonce,
  }).toString()
  return redirectTo(`https://${domainName}${config.refreshAuthPath}?${qs}`, {
    cookies: [
      `spa-auth-edge-nonce=${encodeURIComponent(nonce)}; ${
        config.cookieSettings.nonce
      }`,
      `spa-auth-edge-nonce-hmac=${encodeURIComponent(
        createNonceHmac(nonce, config),
      )}; ${config.cookieSettings.nonce}`,
    ],
  })
}

function redirectToSignIn({
  config,
  domainName,
  requestedUri,
}: {
  config: Config
  domainName: string
  requestedUri: string
}): CloudFrontRequestResult {
  const nonce = generateNonce()
  const state = {
    nonce,
    nonceHmac: createNonceHmac(nonce, config),
    ...generatePkceVerifier(config),
  }
  config.logger.debug("Using new state:", state)

  // Encode the state variable as base64 to avoid a bug in Cognito hosted UI
  // when using multiple identity providers.
  // Cognito decodes the URL, causing a malformed link due to the JSON string,
  // and results in an empty 400 response from Cognito.
  const loginQueryString = new URLSearchParams({
    redirect_uri: `https://${domainName}${config.callbackPath}`,
    response_type: "code",
    client_id: config.clientId,
    state: safeBase64Stringify(
      Buffer.from(
        JSON.stringify({ nonce: state.nonce, requestedUri }),
      ).toString("base64"),
    ),
    scope: config.oauthScopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: state.pkceHash,
  }).toString()

  // Return redirect to Cognito Hosted UI for sign-in
  return redirectTo(
    `https://${config.cognitoAuthDomain}/oauth2/authorize?${loginQueryString}`,
    {
      cookies: [
        `spa-auth-edge-nonce=${encodeURIComponent(state.nonce)}; ${
          config.cookieSettings.nonce
        }`,
        `spa-auth-edge-nonce-hmac=${encodeURIComponent(state.nonceHmac)}; ${
          config.cookieSettings.nonce
        }`,
        `spa-auth-edge-pkce=${encodeURIComponent(state.pkce)}; ${
          config.cookieSettings.nonce
        }`,
      ],
    },
  )
}

function generatePkceVerifier(config: Config) {
  // Should be between 43 and 128.
  // This gives a string on 52 chars.
  const pkce = randomBytes(26).toString("hex")

  const verifier = {
    pkce,
    pkceHash: safeBase64Stringify(
      createHash("sha256").update(pkce, "utf8").digest("base64"),
    ),
  }
  config.logger.debug("Generated PKCE verifier:", verifier)
  return verifier
}

function validateUploadFilename(queryString: string): string | undefined {
  const vars = queryString.split('&');
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) === 'filename') {
      if (pair.length < 2 || !pair[1]) {
        return;
      }
      return decodeURIComponent(pair[1])
    }
  }
  return;
}

function constructUploadTargetUri(filename: string): string {
  const id = filename.replace(/\.[^/.]+$/, "")
  return `/clips/${id}/${filename}`
}
