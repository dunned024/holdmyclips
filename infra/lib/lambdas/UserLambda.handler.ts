import { Handler } from "aws-lambda"
import { parse } from "cookie"

type Cookies = Record<string, string | undefined>

let clientId = process.env.COGNITO_CLIENT_ID

export const handler: Handler = async (event, _, callback) => {
  const headers = event.headers ?? {}
  if (!headers || !headers["cookie"]) {
    return undefined
  }

  const cookies = headers["cookie"].reduce(
    (reduced: Cookies[], header: Cookies) => ({
      ...reduced,
      ...(parse(header.value || "") as Cookies),
    }),
    {},
  )

  if (!cookies) {
    return undefined
  }

  const username = cookies[`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`]

  callback(null, {
    status: '200',
    body: {username: username},
  });
}
