import { useAuth } from "react-oidc-context";
import {
  COGNITO_CLIENT_ID,
  COGNITO_REDIRECT_URI,
  COGNITO_REGION,
  COGNITO_USER_POOL_ID,
} from "src/config";
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
