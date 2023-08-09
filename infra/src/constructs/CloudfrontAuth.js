"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudFrontAuth = void 0;
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const aws_cloudfront_1 = require("aws-cdk-lib/aws-cloudfront");
const cdk_lambda_config_1 = require("@henrist/cdk-lambda-config");
const constructs_1 = require("constructs");
const aws_ssm_1 = require("aws-cdk-lib/aws-ssm");
/**
 * Configure previously deployed lambda functions, Cognito client
 * and CloudFront distribution.
 */
class CloudFrontAuth extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.callbackPath = props.callbackPath ?? "/auth/callback";
        this.signOutRedirectTo = props.signOutRedirectTo ?? "/";
        this.signOutPath = props.signOutPath ?? "/auth/sign-out";
        this.refreshAuthPath = props.refreshAuthPath ?? "/auth/refresh";
        this.oauthScopes = [
            "phone",
            "email",
            "profile",
            "openid",
            "aws.cognito.signin.user.admin",
        ];
        this.userPool = props.userPool;
        this.client =
            props.userPool.addClient("UserPoolClient", {
                authFlows: {
                    userPassword: true,
                    userSrp: true,
                },
                oAuth: {
                    flows: {
                        authorizationCodeGrant: true,
                    },
                    callbackUrls: [`https://${props.fqdn}${this.callbackPath}`],
                    logoutUrls: [`https://${props.fqdn}${this.signOutRedirectTo}`]
                },
                preventUserExistenceErrors: true,
                generateSecret: true,
            });
        const nonceSigningSecret = aws_ssm_1.StringParameter.valueForStringParameter(this, 'hold-my-clips-basic-auth');
        const clientSecretValue = this.client.userPoolClientSecret.toString();
        const config = {
            httpHeaders: {
                "Content-Security-Policy": "default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; connect-src 'self'",
                "Strict-Transport-Security": "max-age=31536000; includeSubdomains; preload",
                "Referrer-Policy": "same-origin",
                "X-XSS-Protection": "1; mode=block",
                "X-Frame-Options": "DENY",
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-cache",
            },
            logLevel: props.logLevel ?? "warn",
            userPoolId: this.userPool.userPoolId,
            clientId: this.client.userPoolClientId,
            clientSecret: clientSecretValue,
            oauthScopes: this.oauthScopes,
            cognitoAuthDomain: props.cognitoAuthDomain,
            callbackPath: this.callbackPath,
            signOutRedirectTo: this.signOutRedirectTo,
            signOutPath: this.signOutPath,
            refreshAuthPath: this.refreshAuthPath,
            requireGroupAnyOf: props.requireGroupAnyOf,
            cookieSettings: {
                /*
                spaMode - consider if this should be supported
                idToken: "Path=/; Secure; SameSite=Lax",
                accessToken: "Path=/; Secure; SameSite=Lax",
                refreshToken: "Path=/; Secure; SameSite=Lax",
                nonce: "Path=/; Secure; HttpOnly; SameSite=Lax",
                */
                idToken: "Path=/; Secure; HttpOnly; SameSite=Lax",
                accessToken: "Path=/; Secure; HttpOnly; SameSite=Lax",
                refreshToken: "Path=/; Secure; HttpOnly; SameSite=Lax",
                nonce: "Path=/; Secure; HttpOnly; SameSite=Lax",
            },
            nonceSigningSecret,
        };
        this.checkAuthFn = new cdk_lambda_config_1.LambdaConfig(this, "CheckAuthFn", {
            function: props.authLambdas.checkAuthFn,
            config,
        }).version;
        this.httpHeadersFn = new cdk_lambda_config_1.LambdaConfig(this, "HttpHeadersFn", {
            function: props.authLambdas.httpHeadersFn,
            config,
        }).version;
        this.parseAuthFn = new cdk_lambda_config_1.LambdaConfig(this, "ParseAuthFn", {
            function: props.authLambdas.parseAuthFn,
            config,
        }).version;
        this.refreshAuthFn = new cdk_lambda_config_1.LambdaConfig(this, "RefreshAuthFn", {
            function: props.authLambdas.refreshAuthFn,
            config,
        }).version;
        this.signOutFn = new cdk_lambda_config_1.LambdaConfig(this, "SignOutFn", {
            function: props.authLambdas.signOutFn,
            config,
        }).version;
    }
    /**
     * Create behaviors for authentication pages.
     *
     * - callback page
     * - refresh page
     * - sign out page
     *
     * This is to be used with Distribution.
     */
    createAuthPagesBehaviors(origin, options) {
        function path(path, fn) {
            return {
                [path]: {
                    origin,
                    compress: true,
                    viewerProtocolPolicy: aws_cloudfront_1.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    edgeLambdas: [
                        {
                            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                            functionVersion: fn,
                        },
                    ],
                    ...options,
                },
            };
        }
        return {
            ...path(this.callbackPath, this.parseAuthFn),
            ...path(this.refreshAuthPath, this.refreshAuthFn),
            ...path(this.signOutPath, this.signOutFn),
        };
    }
    /**
     * Create behavior that includes authorization check.
     *
     * This is to be used with Distribution.
     */
    createProtectedBehavior(origin, options) {
        if (options?.edgeLambdas != null) {
            throw Error("User-defined edgeLambdas is currently not supported");
        }
        return {
            origin,
            compress: true,
            viewerProtocolPolicy: aws_cloudfront_1.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            edgeLambdas: [
                {
                    eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                    functionVersion: this.checkAuthFn,
                },
                {
                    eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
                    functionVersion: this.httpHeadersFn,
                },
            ],
            ...options,
        };
    }
}
exports.CloudFrontAuth = CloudFrontAuth;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xvdWRmcm9udEF1dGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDbG91ZGZyb250QXV0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVFQUF3RDtBQUN4RCwrREFLbUM7QUFJbkMsa0VBQXlEO0FBR3pELDJDQUFzQztBQUV0QyxpREFBc0Q7QUEyRHREOzs7R0FHRztBQUNILE1BQWEsY0FBZSxTQUFRLHNCQUFTO0lBaUIzQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTBCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFaEIsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxJQUFJLGdCQUFnQixDQUFBO1FBQzFELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUMsaUJBQWlCLElBQUksR0FBRyxDQUFBO1FBQ3ZELElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsSUFBSSxnQkFBZ0IsQ0FBQTtRQUN4RCxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLElBQUksZUFBZSxDQUFBO1FBRS9ELElBQUksQ0FBQyxXQUFXLEdBQUc7WUFDakIsT0FBTztZQUNQLE9BQU87WUFDUCxTQUFTO1lBQ1QsUUFBUTtZQUNSLCtCQUErQjtTQUNoQyxDQUFBO1FBRUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFBO1FBRTlCLElBQUksQ0FBQyxNQUFNO1lBQ1QsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ3pDLFNBQVMsRUFBRTtvQkFDVCxZQUFZLEVBQUUsSUFBSTtvQkFDbEIsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7Z0JBQ0QsS0FBSyxFQUFFO29CQUNMLEtBQUssRUFBRTt3QkFDTCxzQkFBc0IsRUFBRSxJQUFJO3FCQUM3QjtvQkFDRCxZQUFZLEVBQUUsQ0FBQyxXQUFXLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUMzRCxVQUFVLEVBQUUsQ0FBQyxXQUFXLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7aUJBQy9EO2dCQUNELDBCQUEwQixFQUFFLElBQUk7Z0JBQ2hDLGNBQWMsRUFBRSxJQUFJO2FBQ3JCLENBQUMsQ0FBQTtRQUVKLE1BQU0sa0JBQWtCLEdBQUcseUJBQWUsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLENBQUMsQ0FBQTtRQUVwRyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLENBQUE7UUFFckUsTUFBTSxNQUFNLEdBQWlCO1lBQzNCLFdBQVcsRUFBRTtnQkFDWCx5QkFBeUIsRUFDdkIsZ0lBQWdJO2dCQUNsSSwyQkFBMkIsRUFDekIsOENBQThDO2dCQUNoRCxpQkFBaUIsRUFBRSxhQUFhO2dCQUNoQyxrQkFBa0IsRUFBRSxlQUFlO2dCQUNuQyxpQkFBaUIsRUFBRSxNQUFNO2dCQUN6Qix3QkFBd0IsRUFBRSxTQUFTO2dCQUNuQyxlQUFlLEVBQUUsVUFBVTthQUM1QjtZQUNELFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxJQUFJLE1BQU07WUFDbEMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtZQUNwQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0I7WUFDdEMsWUFBWSxFQUFFLGlCQUFpQjtZQUMvQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLGlCQUFpQjtZQUMxQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtZQUN6QyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3JDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxpQkFBaUI7WUFDMUMsY0FBYyxFQUFFO2dCQUNkOzs7Ozs7a0JBTUU7Z0JBQ0YsT0FBTyxFQUFFLHdDQUF3QztnQkFDakQsV0FBVyxFQUFFLHdDQUF3QztnQkFDckQsWUFBWSxFQUFFLHdDQUF3QztnQkFDdEQsS0FBSyxFQUFFLHdDQUF3QzthQUNoRDtZQUNELGtCQUFrQjtTQUNuQixDQUFBO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLGdDQUFZLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUN2RCxRQUFRLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFXO1lBQ3ZDLE1BQU07U0FDUCxDQUFDLENBQUMsT0FBTyxDQUFBO1FBRVYsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLGdDQUFZLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUMzRCxRQUFRLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxhQUFhO1lBQ3pDLE1BQU07U0FDUCxDQUFDLENBQUMsT0FBTyxDQUFBO1FBRVYsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLGdDQUFZLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUN2RCxRQUFRLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFXO1lBQ3ZDLE1BQU07U0FDUCxDQUFDLENBQUMsT0FBTyxDQUFBO1FBRVYsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLGdDQUFZLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUMzRCxRQUFRLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxhQUFhO1lBQ3pDLE1BQU07U0FDUCxDQUFDLENBQUMsT0FBTyxDQUFBO1FBRVYsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGdDQUFZLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNuRCxRQUFRLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxTQUFTO1lBQ3JDLE1BQU07U0FDUCxDQUFDLENBQUMsT0FBTyxDQUFBO0lBQ1osQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0ksd0JBQXdCLENBQzdCLE1BQWUsRUFDZixPQUE0QjtRQUU1QixTQUFTLElBQUksQ0FBQyxJQUFZLEVBQUUsRUFBWTtZQUN0QyxPQUFPO2dCQUNMLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ04sTUFBTTtvQkFDTixRQUFRLEVBQUUsSUFBSTtvQkFDZCxvQkFBb0IsRUFBRSxxQ0FBb0IsQ0FBQyxpQkFBaUI7b0JBQzVELFdBQVcsRUFBRTt3QkFDWDs0QkFDRSxTQUFTLEVBQUUsVUFBVSxDQUFDLG1CQUFtQixDQUFDLGNBQWM7NEJBQ3hELGVBQWUsRUFBRSxFQUFFO3lCQUNwQjtxQkFDRjtvQkFDRCxHQUFHLE9BQU87aUJBQ1g7YUFDRixDQUFBO1FBQ0gsQ0FBQztRQUVELE9BQU87WUFDTCxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDNUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDO1lBQ2pELEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztTQUMxQyxDQUFBO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSx1QkFBdUIsQ0FDNUIsTUFBZSxFQUNmLE9BQTRCO1FBRTVCLElBQUksT0FBTyxFQUFFLFdBQVcsSUFBSSxJQUFJLEVBQUU7WUFDaEMsTUFBTSxLQUFLLENBQUMscURBQXFELENBQUMsQ0FBQTtTQUNuRTtRQUVELE9BQU87WUFDTCxNQUFNO1lBQ04sUUFBUSxFQUFFLElBQUk7WUFDZCxvQkFBb0IsRUFBRSxxQ0FBb0IsQ0FBQyxpQkFBaUI7WUFDNUQsV0FBVyxFQUFFO2dCQUNYO29CQUNFLFNBQVMsRUFBRSxVQUFVLENBQUMsbUJBQW1CLENBQUMsY0FBYztvQkFDeEQsZUFBZSxFQUFFLElBQUksQ0FBQyxXQUFXO2lCQUNsQztnQkFDRDtvQkFDRSxTQUFTLEVBQUUsVUFBVSxDQUFDLG1CQUFtQixDQUFDLGVBQWU7b0JBQ3pELGVBQWUsRUFBRSxJQUFJLENBQUMsYUFBYTtpQkFDcEM7YUFDRjtZQUNELEdBQUcsT0FBTztTQUNYLENBQUE7SUFDSCxDQUFDO0NBQ0Y7QUE1TEQsd0NBNExDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnRcIlxuaW1wb3J0IHtcbiAgQWRkQmVoYXZpb3JPcHRpb25zLFxuICBCZWhhdmlvck9wdGlvbnMsXG4gIElPcmlnaW4sXG4gIFZpZXdlclByb3RvY29sUG9saWN5LFxufSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnRcIlxuaW1wb3J0ICogYXMgY29nbml0byBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZ25pdG9cIlxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCJcbmltcG9ydCB7IElWZXJzaW9uIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGFcIlxuaW1wb3J0IHsgTGFtYmRhQ29uZmlnIH0gZnJvbSBcIkBoZW5yaXN0L2Nkay1sYW1iZGEtY29uZmlnXCJcbmltcG9ydCB7IFN0b3JlZENvbmZpZyB9IGZyb20gXCIuLi9sYW1iZGFzL3V0aWwvY29uZmlnXCJcbmltcG9ydCB7IEF1dGhMYW1iZGFzIH0gZnJvbSBcIi4vQXV0aExhbWJkYXNcIlxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIlxuXG5pbXBvcnQgeyBTdHJpbmdQYXJhbWV0ZXIgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3NtJztcbmltcG9ydCB7IFNlY3JldFZhbHVlIH0gZnJvbSAnYXdzLWNkay1saWInXG5cblxuZXhwb3J0IGludGVyZmFjZSBDbG91ZEZyb250QXV0aFByb3BzIHtcbiAgLyoqXG4gICAqIENvZ25pdG8gQ2xpZW50IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGF1dGhlbnRpY2F0ZSB0aGUgdXNlci5cbiAgICpcbiAgICogSWYgYSBjdXN0b20gY2xpZW50IGlzIHByb3ZpZGVkLCB0aGUgdXBkYXRlQ2xpZW50IG1ldGhvZCBjYW5ub3RcbiAgICogYmUgdXNlZCBzaW5jZSB3ZSBjYW5ub3Qga25vdyB3aGljaCBwYXJhbWV0ZXJzIHdhcyBzZXQuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gYSBuZXcgY2xpZW50IHdpbGwgYmUgZ2VuZXJhdGVkXG4gICAqL1xuICB1c2VyUG9vbDogY29nbml0by5JVXNlclBvb2xcbiAgLyoqXG4gICAqIFRoZSBkb21haW4gdGhhdCBpcyB1c2VkIGZvciBDb2duaXRvIEF1dGguXG4gICAqXG4gICAqIElmIG5vdCB1c2luZyBjdXN0b20gZG9tYWlucyB0aGlzIHdpbGwgYmUgYSBuYW1lIHVuZGVyIGFtYXpvbmNvZ25pdG8uY29tLlxuICAgKlxuICAgKiBAZXhhbXBsZSBgJHtkb21haW4uZG9tYWluTmFtZX0uYXV0aC4ke3JlZ2lvbn0uYW1hem9uY29nbml0by5jb21gXG4gICAqL1xuICBjb2duaXRvQXV0aERvbWFpbjogc3RyaW5nXG4gIGF1dGhMYW1iZGFzOiBBdXRoTGFtYmRhc1xuICAvKipcbiAgICogRnVsbHktcXVhbGlmaWVkIGRvbWFpbiBuYW1lXG4gICAqL1xuICBmcWRuOiBzdHJpbmdcbiAgLyoqXG4gICAqIEBkZWZhdWx0IC9hdXRoL2NhbGxiYWNrXG4gICAqL1xuICBjYWxsYmFja1BhdGg/OiBzdHJpbmdcbiAgLyoqXG4gICAqIEBkZWZhdWx0IC9cbiAgICovXG4gIHNpZ25PdXRSZWRpcmVjdFRvPzogc3RyaW5nXG4gIC8qKlxuICAgKiBAZGVmYXVsdCAvYXV0aC9zaWduLW91dFxuICAgKi9cbiAgc2lnbk91dFBhdGg/OiBzdHJpbmdcbiAgLyoqXG4gICAqIEBkZWZhdWx0IC9hdXRoL3JlZnJlc2hcbiAgICovXG4gIHJlZnJlc2hBdXRoUGF0aD86IHN0cmluZ1xuICAvKipcbiAgICogTG9nIGxldmVsLlxuICAgKlxuICAgKiBBIGxvZyBsZXZlbCBvZiBkZWJ1ZyB3aWxsIGxvZyBzZWNyZXRzIGFuZCBzaG91bGQgb25seSBiZSB1c2VkIGluXG4gICAqIGEgZGV2ZWxvcG1lbnQgZW52aXJvbm1lbnQuXG4gICAqXG4gICAqIEBkZWZhdWx0IHdhcm5cbiAgICovXG4gIGxvZ0xldmVsPzogXCJub25lXCIgfCBcImVycm9yXCIgfCBcIndhcm5cIiB8IFwiaW5mb1wiIHwgXCJkZWJ1Z1wiXG4gIC8qKlxuICAgKiBSZXF1aXJlIHRoZSB1c2VyIHRvIGJlIHBhcnQgb2YgYSBzcGVjaWZpYyBDb2duaXRvIGdyb3VwIHRvXG4gICAqIGFjY2VzcyBhbnkgcmVzb3VyY2UuXG4gICAqL1xuICByZXF1aXJlR3JvdXBBbnlPZj86IHN0cmluZ1tdXG59XG5cbi8qKlxuICogQ29uZmlndXJlIHByZXZpb3VzbHkgZGVwbG95ZWQgbGFtYmRhIGZ1bmN0aW9ucywgQ29nbml0byBjbGllbnRcbiAqIGFuZCBDbG91ZEZyb250IGRpc3RyaWJ1dGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENsb3VkRnJvbnRBdXRoIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGNhbGxiYWNrUGF0aDogc3RyaW5nXG4gIHB1YmxpYyByZWFkb25seSBzaWduT3V0UmVkaXJlY3RUbzogc3RyaW5nXG4gIHB1YmxpYyByZWFkb25seSBzaWduT3V0UGF0aDogc3RyaW5nXG4gIHB1YmxpYyByZWFkb25seSByZWZyZXNoQXV0aFBhdGg6IHN0cmluZ1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgdXNlclBvb2w6IGNvZ25pdG8uSVVzZXJQb29sXG4gIHB1YmxpYyByZWFkb25seSBjbGllbnQ6IGNvZ25pdG8uVXNlclBvb2xDbGllbnRcblxuICBwcml2YXRlIHJlYWRvbmx5IGNoZWNrQXV0aEZuOiBsYW1iZGEuSVZlcnNpb25cbiAgcHJpdmF0ZSByZWFkb25seSBodHRwSGVhZGVyc0ZuOiBsYW1iZGEuSVZlcnNpb25cbiAgcHJpdmF0ZSByZWFkb25seSBwYXJzZUF1dGhGbjogbGFtYmRhLklWZXJzaW9uXG4gIHByaXZhdGUgcmVhZG9ubHkgcmVmcmVzaEF1dGhGbjogbGFtYmRhLklWZXJzaW9uXG4gIHByaXZhdGUgcmVhZG9ubHkgc2lnbk91dEZuOiBsYW1iZGEuSVZlcnNpb25cblxuICBwcml2YXRlIHJlYWRvbmx5IG9hdXRoU2NvcGVzOiBzdHJpbmdbXVxuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDbG91ZEZyb250QXV0aFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKVxuXG4gICAgdGhpcy5jYWxsYmFja1BhdGggPSBwcm9wcy5jYWxsYmFja1BhdGggPz8gXCIvYXV0aC9jYWxsYmFja1wiXG4gICAgdGhpcy5zaWduT3V0UmVkaXJlY3RUbyA9IHByb3BzLnNpZ25PdXRSZWRpcmVjdFRvID8/IFwiL1wiXG4gICAgdGhpcy5zaWduT3V0UGF0aCA9IHByb3BzLnNpZ25PdXRQYXRoID8/IFwiL2F1dGgvc2lnbi1vdXRcIlxuICAgIHRoaXMucmVmcmVzaEF1dGhQYXRoID0gcHJvcHMucmVmcmVzaEF1dGhQYXRoID8/IFwiL2F1dGgvcmVmcmVzaFwiXG5cbiAgICB0aGlzLm9hdXRoU2NvcGVzID0gW1xuICAgICAgXCJwaG9uZVwiLFxuICAgICAgXCJlbWFpbFwiLFxuICAgICAgXCJwcm9maWxlXCIsXG4gICAgICBcIm9wZW5pZFwiLFxuICAgICAgXCJhd3MuY29nbml0by5zaWduaW4udXNlci5hZG1pblwiLFxuICAgIF1cblxuICAgIHRoaXMudXNlclBvb2wgPSBwcm9wcy51c2VyUG9vbFxuXG4gICAgdGhpcy5jbGllbnQgPVxuICAgICAgcHJvcHMudXNlclBvb2wuYWRkQ2xpZW50KFwiVXNlclBvb2xDbGllbnRcIiwge1xuICAgICAgICBhdXRoRmxvd3M6IHtcbiAgICAgICAgICB1c2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgICAgdXNlclNycDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgb0F1dGg6IHtcbiAgICAgICAgICBmbG93czoge1xuICAgICAgICAgICAgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNhbGxiYWNrVXJsczogW2BodHRwczovLyR7cHJvcHMuZnFkbn0ke3RoaXMuY2FsbGJhY2tQYXRofWBdLFxuICAgICAgICAgIGxvZ291dFVybHM6IFtgaHR0cHM6Ly8ke3Byb3BzLmZxZG59JHt0aGlzLnNpZ25PdXRSZWRpcmVjdFRvfWBdXG4gICAgICAgIH0sXG4gICAgICAgIHByZXZlbnRVc2VyRXhpc3RlbmNlRXJyb3JzOiB0cnVlLFxuICAgICAgICBnZW5lcmF0ZVNlY3JldDogdHJ1ZSxcbiAgICAgIH0pXG5cbiAgICBjb25zdCBub25jZVNpZ25pbmdTZWNyZXQgPSBTdHJpbmdQYXJhbWV0ZXIudmFsdWVGb3JTdHJpbmdQYXJhbWV0ZXIodGhpcywgJ2hvbGQtbXktY2xpcHMtYmFzaWMtYXV0aCcpXG4gIFxuICAgIGNvbnN0IGNsaWVudFNlY3JldFZhbHVlID0gdGhpcy5jbGllbnQudXNlclBvb2xDbGllbnRTZWNyZXQudG9TdHJpbmcoKVxuXG4gICAgY29uc3QgY29uZmlnOiBTdG9yZWRDb25maWcgPSB7XG4gICAgICBodHRwSGVhZGVyczoge1xuICAgICAgICBcIkNvbnRlbnQtU2VjdXJpdHktUG9saWN5XCI6XG4gICAgICAgICAgXCJkZWZhdWx0LXNyYyAnbm9uZSc7IGltZy1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJzsgc3R5bGUtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZSc7IG9iamVjdC1zcmMgJ25vbmUnOyBjb25uZWN0LXNyYyAnc2VsZidcIixcbiAgICAgICAgXCJTdHJpY3QtVHJhbnNwb3J0LVNlY3VyaXR5XCI6XG4gICAgICAgICAgXCJtYXgtYWdlPTMxNTM2MDAwOyBpbmNsdWRlU3ViZG9tYWluczsgcHJlbG9hZFwiLFxuICAgICAgICBcIlJlZmVycmVyLVBvbGljeVwiOiBcInNhbWUtb3JpZ2luXCIsXG4gICAgICAgIFwiWC1YU1MtUHJvdGVjdGlvblwiOiBcIjE7IG1vZGU9YmxvY2tcIixcbiAgICAgICAgXCJYLUZyYW1lLU9wdGlvbnNcIjogXCJERU5ZXCIsXG4gICAgICAgIFwiWC1Db250ZW50LVR5cGUtT3B0aW9uc1wiOiBcIm5vc25pZmZcIixcbiAgICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwibm8tY2FjaGVcIixcbiAgICAgIH0sXG4gICAgICBsb2dMZXZlbDogcHJvcHMubG9nTGV2ZWwgPz8gXCJ3YXJuXCIsXG4gICAgICB1c2VyUG9vbElkOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBjbGllbnRJZDogdGhpcy5jbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgIGNsaWVudFNlY3JldDogY2xpZW50U2VjcmV0VmFsdWUsXG4gICAgICBvYXV0aFNjb3BlczogdGhpcy5vYXV0aFNjb3BlcyxcbiAgICAgIGNvZ25pdG9BdXRoRG9tYWluOiBwcm9wcy5jb2duaXRvQXV0aERvbWFpbixcbiAgICAgIGNhbGxiYWNrUGF0aDogdGhpcy5jYWxsYmFja1BhdGgsXG4gICAgICBzaWduT3V0UmVkaXJlY3RUbzogdGhpcy5zaWduT3V0UmVkaXJlY3RUbyxcbiAgICAgIHNpZ25PdXRQYXRoOiB0aGlzLnNpZ25PdXRQYXRoLFxuICAgICAgcmVmcmVzaEF1dGhQYXRoOiB0aGlzLnJlZnJlc2hBdXRoUGF0aCxcbiAgICAgIHJlcXVpcmVHcm91cEFueU9mOiBwcm9wcy5yZXF1aXJlR3JvdXBBbnlPZixcbiAgICAgIGNvb2tpZVNldHRpbmdzOiB7XG4gICAgICAgIC8qXG4gICAgICAgIHNwYU1vZGUgLSBjb25zaWRlciBpZiB0aGlzIHNob3VsZCBiZSBzdXBwb3J0ZWRcbiAgICAgICAgaWRUb2tlbjogXCJQYXRoPS87IFNlY3VyZTsgU2FtZVNpdGU9TGF4XCIsXG4gICAgICAgIGFjY2Vzc1Rva2VuOiBcIlBhdGg9LzsgU2VjdXJlOyBTYW1lU2l0ZT1MYXhcIixcbiAgICAgICAgcmVmcmVzaFRva2VuOiBcIlBhdGg9LzsgU2VjdXJlOyBTYW1lU2l0ZT1MYXhcIixcbiAgICAgICAgbm9uY2U6IFwiUGF0aD0vOyBTZWN1cmU7IEh0dHBPbmx5OyBTYW1lU2l0ZT1MYXhcIixcbiAgICAgICAgKi9cbiAgICAgICAgaWRUb2tlbjogXCJQYXRoPS87IFNlY3VyZTsgSHR0cE9ubHk7IFNhbWVTaXRlPUxheFwiLFxuICAgICAgICBhY2Nlc3NUb2tlbjogXCJQYXRoPS87IFNlY3VyZTsgSHR0cE9ubHk7IFNhbWVTaXRlPUxheFwiLFxuICAgICAgICByZWZyZXNoVG9rZW46IFwiUGF0aD0vOyBTZWN1cmU7IEh0dHBPbmx5OyBTYW1lU2l0ZT1MYXhcIixcbiAgICAgICAgbm9uY2U6IFwiUGF0aD0vOyBTZWN1cmU7IEh0dHBPbmx5OyBTYW1lU2l0ZT1MYXhcIixcbiAgICAgIH0sXG4gICAgICBub25jZVNpZ25pbmdTZWNyZXQsXG4gICAgfVxuXG4gICAgdGhpcy5jaGVja0F1dGhGbiA9IG5ldyBMYW1iZGFDb25maWcodGhpcywgXCJDaGVja0F1dGhGblwiLCB7XG4gICAgICBmdW5jdGlvbjogcHJvcHMuYXV0aExhbWJkYXMuY2hlY2tBdXRoRm4sXG4gICAgICBjb25maWcsXG4gICAgfSkudmVyc2lvblxuXG4gICAgdGhpcy5odHRwSGVhZGVyc0ZuID0gbmV3IExhbWJkYUNvbmZpZyh0aGlzLCBcIkh0dHBIZWFkZXJzRm5cIiwge1xuICAgICAgZnVuY3Rpb246IHByb3BzLmF1dGhMYW1iZGFzLmh0dHBIZWFkZXJzRm4sXG4gICAgICBjb25maWcsXG4gICAgfSkudmVyc2lvblxuXG4gICAgdGhpcy5wYXJzZUF1dGhGbiA9IG5ldyBMYW1iZGFDb25maWcodGhpcywgXCJQYXJzZUF1dGhGblwiLCB7XG4gICAgICBmdW5jdGlvbjogcHJvcHMuYXV0aExhbWJkYXMucGFyc2VBdXRoRm4sXG4gICAgICBjb25maWcsXG4gICAgfSkudmVyc2lvblxuXG4gICAgdGhpcy5yZWZyZXNoQXV0aEZuID0gbmV3IExhbWJkYUNvbmZpZyh0aGlzLCBcIlJlZnJlc2hBdXRoRm5cIiwge1xuICAgICAgZnVuY3Rpb246IHByb3BzLmF1dGhMYW1iZGFzLnJlZnJlc2hBdXRoRm4sXG4gICAgICBjb25maWcsXG4gICAgfSkudmVyc2lvblxuXG4gICAgdGhpcy5zaWduT3V0Rm4gPSBuZXcgTGFtYmRhQ29uZmlnKHRoaXMsIFwiU2lnbk91dEZuXCIsIHtcbiAgICAgIGZ1bmN0aW9uOiBwcm9wcy5hdXRoTGFtYmRhcy5zaWduT3V0Rm4sXG4gICAgICBjb25maWcsXG4gICAgfSkudmVyc2lvblxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBiZWhhdmlvcnMgZm9yIGF1dGhlbnRpY2F0aW9uIHBhZ2VzLlxuICAgKlxuICAgKiAtIGNhbGxiYWNrIHBhZ2VcbiAgICogLSByZWZyZXNoIHBhZ2VcbiAgICogLSBzaWduIG91dCBwYWdlXG4gICAqXG4gICAqIFRoaXMgaXMgdG8gYmUgdXNlZCB3aXRoIERpc3RyaWJ1dGlvbi5cbiAgICovXG4gIHB1YmxpYyBjcmVhdGVBdXRoUGFnZXNCZWhhdmlvcnMoXG4gICAgb3JpZ2luOiBJT3JpZ2luLFxuICAgIG9wdGlvbnM/OiBBZGRCZWhhdmlvck9wdGlvbnMsXG4gICk6IFJlY29yZDxzdHJpbmcsIEJlaGF2aW9yT3B0aW9ucz4ge1xuICAgIGZ1bmN0aW9uIHBhdGgocGF0aDogc3RyaW5nLCBmbjogSVZlcnNpb24pOiBSZWNvcmQ8c3RyaW5nLCBCZWhhdmlvck9wdGlvbnM+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFtwYXRoXToge1xuICAgICAgICAgIG9yaWdpbixcbiAgICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgICAgZWRnZUxhbWJkYXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZXZlbnRUeXBlOiBjbG91ZGZyb250LkxhbWJkYUVkZ2VFdmVudFR5cGUuVklFV0VSX1JFUVVFU1QsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uVmVyc2lvbjogZm4sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4ucGF0aCh0aGlzLmNhbGxiYWNrUGF0aCwgdGhpcy5wYXJzZUF1dGhGbiksXG4gICAgICAuLi5wYXRoKHRoaXMucmVmcmVzaEF1dGhQYXRoLCB0aGlzLnJlZnJlc2hBdXRoRm4pLFxuICAgICAgLi4ucGF0aCh0aGlzLnNpZ25PdXRQYXRoLCB0aGlzLnNpZ25PdXRGbiksXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBiZWhhdmlvciB0aGF0IGluY2x1ZGVzIGF1dGhvcml6YXRpb24gY2hlY2suXG4gICAqXG4gICAqIFRoaXMgaXMgdG8gYmUgdXNlZCB3aXRoIERpc3RyaWJ1dGlvbi5cbiAgICovXG4gIHB1YmxpYyBjcmVhdGVQcm90ZWN0ZWRCZWhhdmlvcihcbiAgICBvcmlnaW46IElPcmlnaW4sXG4gICAgb3B0aW9ucz86IEFkZEJlaGF2aW9yT3B0aW9ucyxcbiAgKTogQmVoYXZpb3JPcHRpb25zIHtcbiAgICBpZiAob3B0aW9ucz8uZWRnZUxhbWJkYXMgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJVc2VyLWRlZmluZWQgZWRnZUxhbWJkYXMgaXMgY3VycmVudGx5IG5vdCBzdXBwb3J0ZWRcIilcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgb3JpZ2luLFxuICAgICAgY29tcHJlc3M6IHRydWUsXG4gICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICBlZGdlTGFtYmRhczogW1xuICAgICAgICB7XG4gICAgICAgICAgZXZlbnRUeXBlOiBjbG91ZGZyb250LkxhbWJkYUVkZ2VFdmVudFR5cGUuVklFV0VSX1JFUVVFU1QsXG4gICAgICAgICAgZnVuY3Rpb25WZXJzaW9uOiB0aGlzLmNoZWNrQXV0aEZuLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnRUeXBlOiBjbG91ZGZyb250LkxhbWJkYUVkZ2VFdmVudFR5cGUuT1JJR0lOX1JFU1BPTlNFLFxuICAgICAgICAgIGZ1bmN0aW9uVmVyc2lvbjogdGhpcy5odHRwSGVhZGVyc0ZuLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfVxuICB9XG59XG4iXX0=