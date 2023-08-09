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
exports.getConfig = void 0;
const cookie_1 = require("cookie");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const logger_1 = require("./logger");
function getConfig() {
    const config = JSON.parse((0, fs_1.readFileSync)(path.join(__dirname, "/config.json"), "utf-8"));
    // Derive the issuer and JWKS uri all JWT's will be signed with from
    // the User Pool's ID and region.
    const userPoolRegion = /^(\S+?)_\S+$/.exec(config.userPoolId)[1];
    const tokenIssuer = `https://cognito-idp.${userPoolRegion}.amazonaws.com/${config.userPoolId}`;
    const tokenJwksUri = `${tokenIssuer}/.well-known/jwks.json`;
    return {
        nonceMaxAge: parseInt((0, cookie_1.parse)(config.cookieSettings.nonce.toLowerCase())["max-age"]) ||
            60 * 60 * 24,
        ...config,
        tokenIssuer,
        tokenJwksUri,
        logger: new logger_1.Logger(logger_1.LogLevel[config.logLevel]),
    };
}
exports.getConfig = getConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQThCO0FBQzlCLDJCQUFpQztBQUNqQywyQ0FBNEI7QUFHNUIscUNBQTJDO0FBMEIzQyxTQUFnQixTQUFTO0lBQ3ZCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQ3ZCLElBQUEsaUJBQVksRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FDNUMsQ0FBQTtJQUVqQixvRUFBb0U7SUFDcEUsaUNBQWlDO0lBQ2pDLE1BQU0sY0FBYyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ2pFLE1BQU0sV0FBVyxHQUFHLHVCQUF1QixjQUFjLGtCQUFrQixNQUFNLENBQUMsVUFBVSxFQUFFLENBQUE7SUFDOUYsTUFBTSxZQUFZLEdBQUcsR0FBRyxXQUFXLHdCQUF3QixDQUFBO0lBRTNELE9BQU87UUFDTCxXQUFXLEVBQ1QsUUFBUSxDQUFDLElBQUEsY0FBSyxFQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO1FBQ2QsR0FBRyxNQUFNO1FBQ1QsV0FBVztRQUNYLFlBQVk7UUFDWixNQUFNLEVBQUUsSUFBSSxlQUFNLENBQUMsaUJBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDOUMsQ0FBQTtBQUNILENBQUM7QUFwQkQsOEJBb0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiY29va2llXCJcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gXCJmc1wiXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCJcbmltcG9ydCB7IEh0dHBIZWFkZXJzIH0gZnJvbSBcIi4vY2xvdWRmcm9udFwiXG5pbXBvcnQgeyBDb29raWVTZXR0aW5ncyB9IGZyb20gXCIuL2Nvb2tpZXNcIlxuaW1wb3J0IHsgTG9nZ2VyLCBMb2dMZXZlbCB9IGZyb20gXCIuL2xvZ2dlclwiXG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmVkQ29uZmlnIHtcbiAgdXNlclBvb2xJZDogc3RyaW5nXG4gIGNsaWVudElkOiBzdHJpbmdcbiAgb2F1dGhTY29wZXM6IHN0cmluZ1tdXG4gIGNvZ25pdG9BdXRoRG9tYWluOiBzdHJpbmdcbiAgY2FsbGJhY2tQYXRoOiBzdHJpbmdcbiAgc2lnbk91dFJlZGlyZWN0VG86IHN0cmluZ1xuICBzaWduT3V0UGF0aDogc3RyaW5nXG4gIHJlZnJlc2hBdXRoUGF0aDogc3RyaW5nXG4gIGNvb2tpZVNldHRpbmdzOiBDb29raWVTZXR0aW5nc1xuICBodHRwSGVhZGVyczogSHR0cEhlYWRlcnNcbiAgY2xpZW50U2VjcmV0OiBzdHJpbmdcbiAgbm9uY2VTaWduaW5nU2VjcmV0OiBzdHJpbmdcbiAgbG9nTGV2ZWw6IGtleW9mIHR5cGVvZiBMb2dMZXZlbFxuICByZXF1aXJlR3JvdXBBbnlPZj86IHN0cmluZ1tdIHwgbnVsbFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZyBleHRlbmRzIFN0b3JlZENvbmZpZyB7XG4gIHRva2VuSXNzdWVyOiBzdHJpbmdcbiAgdG9rZW5Kd2tzVXJpOiBzdHJpbmdcbiAgbG9nZ2VyOiBMb2dnZXJcbiAgbm9uY2VNYXhBZ2U6IG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnKCk6IENvbmZpZyB7XG4gIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UoXG4gICAgcmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsIFwiL2NvbmZpZy5qc29uXCIpLCBcInV0Zi04XCIpLFxuICApIGFzIFN0b3JlZENvbmZpZ1xuXG4gIC8vIERlcml2ZSB0aGUgaXNzdWVyIGFuZCBKV0tTIHVyaSBhbGwgSldUJ3Mgd2lsbCBiZSBzaWduZWQgd2l0aCBmcm9tXG4gIC8vIHRoZSBVc2VyIFBvb2wncyBJRCBhbmQgcmVnaW9uLlxuICBjb25zdCB1c2VyUG9vbFJlZ2lvbiA9IC9eKFxcUys/KV9cXFMrJC8uZXhlYyhjb25maWcudXNlclBvb2xJZCkhWzFdXG4gIGNvbnN0IHRva2VuSXNzdWVyID0gYGh0dHBzOi8vY29nbml0by1pZHAuJHt1c2VyUG9vbFJlZ2lvbn0uYW1hem9uYXdzLmNvbS8ke2NvbmZpZy51c2VyUG9vbElkfWBcbiAgY29uc3QgdG9rZW5Kd2tzVXJpID0gYCR7dG9rZW5Jc3N1ZXJ9Ly53ZWxsLWtub3duL2p3a3MuanNvbmBcblxuICByZXR1cm4ge1xuICAgIG5vbmNlTWF4QWdlOlxuICAgICAgcGFyc2VJbnQocGFyc2UoY29uZmlnLmNvb2tpZVNldHRpbmdzLm5vbmNlLnRvTG93ZXJDYXNlKCkpW1wibWF4LWFnZVwiXSkgfHxcbiAgICAgIDYwICogNjAgKiAyNCxcbiAgICAuLi5jb25maWcsXG4gICAgdG9rZW5Jc3N1ZXIsXG4gICAgdG9rZW5Kd2tzVXJpLFxuICAgIGxvZ2dlcjogbmV3IExvZ2dlcihMb2dMZXZlbFtjb25maWcubG9nTGV2ZWxdKSxcbiAgfVxufVxuIl19