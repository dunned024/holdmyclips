import { getCookie } from 'typescript-cookie';
import { COGNITO_CLIENT_ID } from '../config';

export function getUsername(): string | undefined {
  if (process.env.NODE_ENV === 'development') {
    return 'test_user';
  }
  const cookieKey = `CognitoIdentityServiceProvider.${COGNITO_CLIENT_ID}.LastAuthUser`;
  return getCookie(cookieKey);
}
