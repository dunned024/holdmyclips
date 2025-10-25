import {
  COGNITO_CLIENT_ID,
  COGNITO_REDIRECT_URI,
  COGNITO_REGION,
  COGNITO_USER_POOL_ID,
} from "src/config";

export const cognitoAuthConfig = {
  authority: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
  client_id: COGNITO_CLIENT_ID,
  redirect_uri: COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "email openid profile",
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
  automaticSilentRenew: true,
  monitorSession: true,
};
