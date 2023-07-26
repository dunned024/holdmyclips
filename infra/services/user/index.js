const clientId = process.env.COGNITO_CLIENT_ID

export const handler = async (event, _, _) => {
  console.log("function start")
  const headers = event.headers ?? {}
  if (!headers) {
    console.log({
      headers: headers,
      message: "headers not found"
    })
    return JSON.stringify({
      statusCode: 400,
      body: JSON.stringify({ error: "headers not found" })
    })
  }
  console.log({ headers })

  const cookies  = headers["cookie"] || headers["Cookie"]
  if (!cookies) {
    console.log("cookies not found in headers")
    
    return JSON.stringify({
      statusCode: 400,
      body: JSON.stringify({ error: "cookies not found in headers" })
    })
  }
  console.log({ cookies })

  const splitCookies = Object.fromEntries(cookies.split(";").map(pair => pair.trim().split("=")))
  console.log({ splitCookies })

  console.log({ clientId })
  const username = splitCookies[`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`]
  console.log({ username })

  const response = {
      statusCode: 200,
      body: JSON.stringify({ username })
  };
  console.log("response: " + JSON.stringify(response))
  return response;
}
