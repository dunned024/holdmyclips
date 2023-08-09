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
exports.AuthLambdas = void 0;
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const path = __importStar(require("path"));
const constructs_1 = require("constructs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
class AuthLambdas extends constructs_1.Construct {
    constructor(scope, id) {
        super(scope, id);
        const role = new iam.Role(this, "ServiceRole", {
            assumedBy: new iam.CompositePrincipal(new iam.ServicePrincipal("lambda.amazonaws.com"), new iam.ServicePrincipal("edgelambda.amazonaws.com")),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
            ],
        });
        this.checkAuthFn = this.addFunction("CheckAuthFn", "check-auth", role);
        this.httpHeadersFn = this.addFunction("HttpHeadersFn", "http-headers", role);
        this.parseAuthFn = this.addFunction("ParseAuthFn", "parse-auth", role);
        this.refreshAuthFn = this.addFunction("RefreshAuthFn", "refresh-auth", role);
        this.signOutFn = this.addFunction("SignOutFn", "sign-out", role);
    }
    addFunction(id, assetName, role) {
        return new lambda.Function(this, id, {
            code: lambda.Code.fromAsset(path.join(__dirname, `../dist/${assetName}`)),
            handler: "index.handler",
            runtime: lambda.Runtime.NODEJS_18_X,
            timeout: aws_cdk_lib_1.Duration.seconds(5),
            role,
        });
    }
}
exports.AuthLambdas = AuthLambdas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXV0aExhbWJkYXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBdXRoTGFtYmRhcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHlEQUEwQztBQUMxQywrREFBZ0Q7QUFDaEQsMkNBQTRCO0FBQzVCLDJDQUFzQztBQUN0Qyw2Q0FBc0M7QUFHdEMsTUFBYSxXQUFZLFNBQVEsc0JBQVM7SUFPeEMsWUFBWSxLQUFnQixFQUFFLEVBQVU7UUFDdEMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUVoQixNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUM3QyxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsa0JBQWtCLENBQ25DLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLEVBQ2hELElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLDBCQUEwQixDQUFDLENBQ3JEO1lBQ0QsZUFBZSxFQUFFO2dCQUNmLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQ3hDLDBDQUEwQyxDQUMzQzthQUNGO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDdEUsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDNUUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDdEUsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDNUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDbEUsQ0FBQztJQUVPLFdBQVcsQ0FBQyxFQUFVLEVBQUUsU0FBaUIsRUFBRSxJQUFlO1FBQ2hFLE9BQU8sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUU7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUN6RSxPQUFPLEVBQUUsZUFBZTtZQUN4QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSTtTQUNMLENBQUMsQ0FBQTtJQUNKLENBQUM7Q0FDRjtBQXRDRCxrQ0FzQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBpYW0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIlxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIlxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIlxuaW1wb3J0IHsgRHVyYXRpb24gfSBmcm9tIFwiYXdzLWNkay1saWJcIlxuXG5cbmV4cG9ydCBjbGFzcyBBdXRoTGFtYmRhcyBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBjaGVja0F1dGhGbjogbGFtYmRhLkZ1bmN0aW9uXG4gIHB1YmxpYyByZWFkb25seSBodHRwSGVhZGVyc0ZuOiBsYW1iZGEuRnVuY3Rpb25cbiAgcHVibGljIHJlYWRvbmx5IHBhcnNlQXV0aEZuOiBsYW1iZGEuRnVuY3Rpb25cbiAgcHVibGljIHJlYWRvbmx5IHJlZnJlc2hBdXRoRm46IGxhbWJkYS5GdW5jdGlvblxuICBwdWJsaWMgcmVhZG9ubHkgc2lnbk91dEZuOiBsYW1iZGEuRnVuY3Rpb25cblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKVxuXG4gICAgY29uc3Qgcm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCBcIlNlcnZpY2VSb2xlXCIsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5Db21wb3NpdGVQcmluY2lwYWwoXG4gICAgICAgIG5ldyBpYW0uU2VydmljZVByaW5jaXBhbChcImxhbWJkYS5hbWF6b25hd3MuY29tXCIpLFxuICAgICAgICBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoXCJlZGdlbGFtYmRhLmFtYXpvbmF3cy5jb21cIiksXG4gICAgICApLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICBcInNlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGVcIixcbiAgICAgICAgKSxcbiAgICAgIF0sXG4gICAgfSlcblxuICAgIHRoaXMuY2hlY2tBdXRoRm4gPSB0aGlzLmFkZEZ1bmN0aW9uKFwiQ2hlY2tBdXRoRm5cIiwgXCJjaGVjay1hdXRoXCIsIHJvbGUpXG4gICAgdGhpcy5odHRwSGVhZGVyc0ZuID0gdGhpcy5hZGRGdW5jdGlvbihcIkh0dHBIZWFkZXJzRm5cIiwgXCJodHRwLWhlYWRlcnNcIiwgcm9sZSlcbiAgICB0aGlzLnBhcnNlQXV0aEZuID0gdGhpcy5hZGRGdW5jdGlvbihcIlBhcnNlQXV0aEZuXCIsIFwicGFyc2UtYXV0aFwiLCByb2xlKVxuICAgIHRoaXMucmVmcmVzaEF1dGhGbiA9IHRoaXMuYWRkRnVuY3Rpb24oXCJSZWZyZXNoQXV0aEZuXCIsIFwicmVmcmVzaC1hdXRoXCIsIHJvbGUpXG4gICAgdGhpcy5zaWduT3V0Rm4gPSB0aGlzLmFkZEZ1bmN0aW9uKFwiU2lnbk91dEZuXCIsIFwic2lnbi1vdXRcIiwgcm9sZSlcbiAgfVxuXG4gIHByaXZhdGUgYWRkRnVuY3Rpb24oaWQ6IHN0cmluZywgYXNzZXROYW1lOiBzdHJpbmcsIHJvbGU6IGlhbS5JUm9sZSkge1xuICAgIHJldHVybiBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIGlkLCB7XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgYC4uL2Rpc3QvJHthc3NldE5hbWV9YCkpLFxuICAgICAgaGFuZGxlcjogXCJpbmRleC5oYW5kbGVyXCIsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoNSksXG4gICAgICByb2xlLFxuICAgIH0pXG4gIH1cbn0iXX0=