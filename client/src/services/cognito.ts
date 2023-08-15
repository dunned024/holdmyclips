import { getCookie } from 'typescript-cookie';

// TODO: Once I can reliably update Lambda@Edge functions,
// provide client_id as a cookie
export const CLIENT_ID = '5imfsh8459i8uikndovo268f5b';

export function getUsername(): string | undefined {
  if (process.env.NODE_ENV === 'development') {
    return 'test_user';
  }
  const cookieKey = `CognitoIdentityServiceProvider.${CLIENT_ID}.LastAuthUser`;
  return getCookie(cookieKey);
}
