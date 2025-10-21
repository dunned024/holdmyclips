import { readFileSync } from "fs";
import * as path from "path";
import { parse } from "cookie";
import type { HttpHeaders } from "./cloudfront";
import type { CookieSettings } from "./cookies";
import { LogLevel, Logger } from "./logger";

export interface StoredConfig {
  userPoolId: string;
  clientId: string;
  oauthScopes: string[];
  cognitoAuthDomain: string;
  callbackPath: string;
  signOutRedirectTo: string;
  signOutPath: string;
  refreshAuthPath: string;
  cookieSettings: CookieSettings;
  httpHeaders: HttpHeaders;
  clientSecret: string;
  nonceSigningSecret: string;
  logLevel: keyof typeof LogLevel;
  requireGroupAnyOf?: string[] | null;
}

export interface Config extends StoredConfig {
  tokenIssuer: string;
  tokenJwksUri: string;
  logger: Logger;
  nonceMaxAge: number;
}

export function getConfig(): Config {
  const config = JSON.parse(
    readFileSync(path.join(__dirname, "/config.json"), "utf-8"),
  ) as StoredConfig;

  // Derive the issuer and JWKS uri all JWT's will be signed with from
  // the User Pool's ID and region.
  const userPoolRegion = /^(\S+?)_\S+$/.exec(config.userPoolId)![1];
  const tokenIssuer = `https://cognito-idp.${userPoolRegion}.amazonaws.com/${config.userPoolId}`;
  const tokenJwksUri = `${tokenIssuer}/.well-known/jwks.json`;

  return {
    nonceMaxAge:
      Number.parseInt(
        parse(config.cookieSettings.nonce.toLowerCase())["max-age"],
      ) || 60 * 60 * 24,
    ...config,
    tokenIssuer,
    tokenJwksUri,
    logger: new Logger(LogLevel[config.logLevel]),
  };
}
