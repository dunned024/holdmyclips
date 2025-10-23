const env = import.meta.env;

export const API_ENDPOINT = env.VITE_API_ENDPOINT || "http://localhost:4000";
export const COGNITO_REGION = env.VITE_COGNITO_REGION || "us-east-1";
export const COGNITO_CLIENT_ID = env.VITE_COGNITO_CLIENT_ID || "";
export const COGNITO_DOMAIN = env.VITE_COGNITO_DOMAIN || "";
export const COGNITO_REDIRECT_URI =
  env.VITE_COGNITO_REDIRECT_URI || "http://localhost:3000/";
export const COGNITO_USER_POOL_ID = env.VITE_COGNITO_USER_POOL_ID || "";
