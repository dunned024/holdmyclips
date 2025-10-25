import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// Cache JWKS client per User Pool
const jwksClients = {};

function getJwksClient(userPoolId, region) {
  const key = `${region}_${userPoolId}`;
  if (!jwksClients[key]) {
    jwksClients[key] = jwksClient({
      jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
    });
  }
  return jwksClients[key];
}

export async function verifyToken(token, userPoolId, region, clientId) {
  try {
    // Decode token header to get key id
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) {
      throw new Error("Invalid token");
    }

    // Get signing key
    const client = getJwksClient(userPoolId, region);
    const key = await client.getSigningKey(decodedToken.header.kid);
    const signingKey = key.getPublicKey();

    // Verify token
    const verified = jwt.verify(token, signingKey, {
      algorithms: ["RS256"],
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      client_id: clientId, // Optional: validate client_id
    });

    return {
      valid: true,
      username: verified.username,
      sub: verified.sub,
      email: verified.email,
      claims: verified,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return {
      valid: false,
      error: error.message,
    };
  }
}
