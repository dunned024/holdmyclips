import { App, Environment, StackProps } from 'aws-cdk-lib'

export interface ConfiguredStackProps extends StackProps {
  env: Environment,
  domainName: string
  fqdn: string  // Fully qualified domain name
  certArn: string
  hostedZoneId: string
  authPaths: {
    callbackPath: string
    signOutRedirectTo: string
    signOutPath: string
    refreshAuthPath: string
  }
}

export function loadConfig(app: App, env: Environment): ConfiguredStackProps {
  const appConfig = app.node.tryGetContext('appConfig');
  
  return {
    env,
    domainName: appConfig.domainName,
    fqdn: appConfig.fqdn,
    certArn: appConfig.certArn,
    hostedZoneId: appConfig.hostedZoneId,
    authPaths: appConfig.authPaths,
  }
}
