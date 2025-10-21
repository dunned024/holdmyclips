import { useAuth } from "react-oidc-context";
import {
  COGNITO_CLIENT_ID_V2,
  COGNITO_DOMAIN,
  COGNITO_REDIRECT_URI,
} from "src/services/cognito";

export function Auth2() {
  const auth = useAuth();

  const handleSignOut = async () => {
    // Clear local tokens first
    await auth.removeUser();

    // Then redirect to Cognito's logout endpoint with proper parameters
    const logoutUrl = `https://${COGNITO_DOMAIN}/logout?client_id=${COGNITO_CLIENT_ID_V2}&logout_uri=${encodeURIComponent(COGNITO_REDIRECT_URI)}`;
    window.location.href = logoutUrl;
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountered error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    console.log(auth.user);
    console.log(auth.user?.profile);
    return (
      <div>
        {/* <pre> Hello: {auth.user?.profile.email} </pre>
        <pre> ID Token: {auth.user?.id_token} </pre>
        <pre> Access Token: {auth.user?.access_token} </pre>
        <pre> Refresh Token: {auth.user?.refresh_token} </pre> */}

        <button onClick={handleSignOut} type="button">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => auth.signinRedirect()} type="button">
        Sign in
      </button>
    </div>
  );
}

export default Auth2;
