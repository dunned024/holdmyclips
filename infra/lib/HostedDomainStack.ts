import { Stack, StackProps } from "aws-cdk-lib";
import {
  Certificate,
  type ICertificate,
} from "aws-cdk-lib/aws-certificatemanager";
import {
  ARecord,
  type IHostedZone,
  PublicHostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import type { ConfiguredStackProps } from "./config";

export interface HostedDomain {
  cert: ICertificate;
  hostedZone: IHostedZone;
}

export class HostedDomainStack extends Stack {
  public readonly hostedDomain: HostedDomain;

  constructor(scope: Construct, id: string, props: ConfiguredStackProps) {
    super(scope, id, props);
    // These constructs (Certificate, HostedZone) were created manually
    const cert = Certificate.fromCertificateArn(
      this,
      "DomainCert",
      props.certArn,
    );

    const hostedZone = PublicHostedZone.fromPublicHostedZoneAttributes(
      this,
      "PublicHostedZone",
      {
        zoneName: props.domainName,
        hostedZoneId: props.hostedZoneId,
      },
    );

    this.hostedDomain = {
      cert,
      hostedZone,
    };
  }
}
