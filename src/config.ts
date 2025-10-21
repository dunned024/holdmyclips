export const ENDPOINT =
  process.env.NODE_ENV === "production"
    ? "https://clips.dunned024.com"
    : "http://localhost:4000";

// TODO: Once I can reliably update Lambda@Edge functions,
// provide client_id as a cookie
export const COGNITO_CLIENT_ID = "5imfsh8459i8uikndovo268f5b";
