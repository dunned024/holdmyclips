import type { User } from "oidc-client-ts";
import { createContext, useCallback, useContext } from "react";
import type { ReactNode } from "react";
import { AuthProvider as OidcAuthProvider, useAuth } from "react-oidc-context";
import {
  COGNITO_CLIENT_ID,
  COGNITO_DOMAIN,
  COGNITO_REDIRECT_URI,
} from "src/config";
import { cognitoAuthConfig } from "src/services/cognito";

export interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // User information
  username: string | undefined;
  accessToken: string | undefined;
  user: User | null | undefined;

  // Authentication actions
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Internal component that uses the auth hook
function AuthContextProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  // Extract username from user profile
  const username = auth.user?.profile["cognito:username"] as string | undefined;

  // Extract access token
  const accessToken = auth.user?.access_token;

  // Sign in function
  const signIn = useCallback(async () => {
    try {
      await auth.signinRedirect();
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }, [auth]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      // Clear local tokens first
      await auth.removeUser();

      // Then redirect to Cognito's logout endpoint with proper parameters
      const logoutUrl = `https://${COGNITO_DOMAIN}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(COGNITO_REDIRECT_URI)}`;
      window.location.href = logoutUrl;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }, [auth]);

  const value: AuthContextType = {
    // Authentication state
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isError: !!auth.error,
    error: auth.error || null,

    // User information
    username,
    accessToken,
    user: auth.user,

    // Authentication actions
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Main provider that wraps both OidcAuthProvider and AuthContextProvider
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <OidcAuthProvider {...cognitoAuthConfig}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </OidcAuthProvider>
  );
}

// Custom hook to use the auth context
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
