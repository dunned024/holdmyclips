import { useAuth } from "react-oidc-context";
import { COGNITO_CLIENT_ID } from "src/config";
import { getCookie } from "typescript-cookie";

export function getUsername(): string | undefined {
  if (process.env.NODE_ENV === "development") {
    return "test_user";
  }
  const cookieKey = `CognitoIdentityServiceProvider.${COGNITO_CLIENT_ID}.LastAuthUser`;
  return getCookie(cookieKey);
}

export function useGetUsername(): string | undefined {
  const auth = useAuth();
  return auth.user?.profile["cognito:username"] as string | undefined;
}

export const COGNITO_CLIENT_ID_V2 = "5hqu7jq0kmgr5v832208bq21od";
export const COGNITO_DOMAIN = "oauth.clips.dunned024.com";
export const COGNITO_REDIRECT_URI = "http://localhost:3000/";

export const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_HrQzvjY0F",
  client_id: COGNITO_CLIENT_ID_V2,
  redirect_uri: COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "email openid profile",
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
  automaticSilentRenew: true,
  monitorSession: true,
};
