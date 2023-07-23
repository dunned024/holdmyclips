import { parse } from "cookie"

let clientId = process.env.COGNITO_CLIENT_ID

export const handler = async (event, _, callback) => {
  const headers = event.headers ?? {}
  if (!headers || !headers["cookie"]) {
    console.log({
      headers: headers,
      message: "headers not found"
    })
    callback(null, {
      status: '400',
      statusDescription: 'Bad request'
    });
  }

  const cookies = headers["cookie"].reduce(
    (reduced, header) => ({
      ...reduced,
      ...parse(header.value || ""),
    }),
    {},
  )
  console.log(cookies)

  if (!cookies) {
    console.log("cookies not found")
    callback(null, {
      status: '400',
      statusDescription: 'Bad request'
    });
  }

  const username = cookies[`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`]

  callback(null, {
    status: '200',
    body: {username: username},
  });
}
