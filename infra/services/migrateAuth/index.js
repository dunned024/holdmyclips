import crypto from "crypto";
import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const cognito = new CognitoIdentityProviderClient({});
const secretsManager = new SecretsManagerClient({});

/**
 * Retrieve the old client secret from Secrets Manager
 */
async function getClientSecret() {
  const secretName = "OldCognitoUserPoolSecret";
  if (!secretName) {
    return null; // No secret configured
  }

  try {
    const response = await secretsManager.send(
      new GetSecretValueCommand({ SecretId: secretName }),
    );

    // Parse JSON and extract client_secret field
    const secretJson = JSON.parse(response.SecretString);
    return secretJson.client_secret;
  } catch (error) {
    console.error("Failed to retrieve client secret:", error);
    throw new Error("Failed to retrieve migration credentials");
  }
}

/**
 * Compute SECRET_HASH for Cognito authentication
 */
function computeSecretHash(username, clientId, clientSecret) {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

/**
 * Lambda function for just-in-time user migration from old Cognito User Pool to new one.
 *
 * This Lambda is triggered by Cognito User Pool Lambda Triggers:
 * - UserMigration_Authentication: When a user tries to sign in
 * - UserMigration_ForgotPassword: When a user requests password reset
 *
 * The Lambda authenticates users against the old pool and migrates them to the new pool.
 */
export const handler = async (event) => {
  if (event.triggerSource === "UserMigration_Authentication") {
    return await handleAuthentication(event);
  } else if (event.triggerSource === "UserMigration_ForgotPassword") {
    return await handleForgotPassword(event);
  }

  console.log(`Unhandled trigger source: ${event.triggerSource}`);
  return event;
};

/**
 * Handle user authentication migration.
 * Attempts to authenticate the user in the old pool, and if successful,
 * migrates them to the new pool with their credentials.
 */
const handleAuthentication = async (event) => {
  const oldClientId = process.env.OLD_CLIENT_ID;
  const oldClientSecret = await getClientSecret();

  if (!oldClientId) {
    console.error("OLD_CLIENT_ID environment variable not set");
    throw new Error("Migration configuration error");
  }

  const authParams = {
    USERNAME: event.userName,
    PASSWORD: event.request.password,
  };

  // Add SECRET_HASH if client has a secret
  if (oldClientSecret) {
    authParams.SECRET_HASH = computeSecretHash(
      event.userName,
      oldClientId,
      oldClientSecret,
    );
  }

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: oldClientId,
    AuthParameters: authParams,
  };

  try {
    // Attempt to authenticate against old pool
    await cognito.send(new InitiateAuthCommand(params));
    console.log("Successfully authenticated user in old pool:", event.userName);

    // Fetch user attributes from old pool to get email
    const getUserParams = {
      UserPoolId: process.env.OLD_USER_POOL_ID,
      Username: event.userName,
    };

    const userDetails = await cognito.send(
      new AdminGetUserCommand(getUserParams),
    );
    const emailAttr = userDetails.UserAttributes?.find(
      (attr) => attr.Name === "email",
    );

    if (!emailAttr?.Value) {
      console.error("User has no email attribute in old pool");
      throw new Error("User migration error: no email");
    }

    // Authentication successful - migrate user to new pool
    event.response.userAttributes = {
      email: emailAttr.Value,
      email_verified: "true",
    };

    // Mark as confirmed so user can immediately sign in
    event.response.finalUserStatus = "CONFIRMED";

    // Suppress welcome email since user is already known
    event.response.messageAction = "SUPPRESS";

    console.log(`Successfully migrated user: ${event.userName}`);
    return event;
  } catch (error) {
    console.error("Migration authentication failed:", {
      username: event.userName,
      error: error.message,
      code: error.name,
    });

    // Don't migrate - user doesn't exist or credentials are wrong
    throw new Error("User not found in old pool or invalid credentials");
  }
};

/**
 * Handle forgot password migration.
 * Looks up the user in the old pool to verify they exist,
 * then allows the password reset to proceed in the new pool.
 */
const handleForgotPassword = async (event) => {
  const oldUserPoolId = process.env.OLD_USER_POOL_ID;

  if (!oldUserPoolId) {
    console.error("OLD_USER_POOL_ID environment variable not set");
    throw new Error("Migration configuration error");
  }

  const params = {
    UserPoolId: oldUserPoolId,
    Username: event.userName,
  };

  try {
    // Look up user in old pool
    const user = await cognito.send(new AdminGetUserCommand(params));
    console.log("Found user in old pool for password reset:", event.userName);

    // Extract email from user attributes
    const emailAttr = user.UserAttributes?.find(
      (attr) => attr.Name === "email",
    );

    if (!emailAttr?.Value) {
      console.error("User has no email attribute");
      throw new Error("User migration error: no email");
    }

    // User exists - migrate them for password reset
    event.response.userAttributes = {
      email: emailAttr.Value,
      email_verified: "true",
    };

    // Suppress migration email since user will get password reset email
    event.response.messageAction = "SUPPRESS";

    console.log(
      `Successfully migrated user for password reset: ${event.userName}`,
    );
    return event;
  } catch (error) {
    console.error("User lookup for password reset failed:", {
      username: event.userName,
      error: error.message,
      code: error.name,
    });

    // Don't migrate - user doesn't exist in old pool
    throw new Error("User not found in old pool");
  }
};
