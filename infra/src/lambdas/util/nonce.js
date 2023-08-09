"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNonceHmac = exports.generateNonce = exports.validateNonce = exports.checkNonceAge = void 0;
const crypto_1 = require("crypto");
function checkNonceAge(nonce, maxAge) {
    // Nonce should not be too old.
    const timestamp = parseInt(nonce.slice(0, nonce.indexOf("T")));
    if (isNaN(timestamp)) {
        return {
            clientError: "Invalid nonce",
        };
    }
    if (timestampInSeconds() - timestamp > maxAge) {
        return {
            clientError: `Nonce is too old (nonce is from ${new Date(timestamp * 1000).toISOString()})`,
        };
    }
    return undefined;
}
exports.checkNonceAge = checkNonceAge;
function validateNonce(nonce, providedHmac, config) {
    const res1 = checkNonceAge(nonce, config.nonceMaxAge);
    if (res1) {
        return res1;
    }
    const calculatedHmac = createNonceHmac(nonce, config);
    if (calculatedHmac !== providedHmac) {
        return {
            clientError: `Nonce signature mismatch! Expected ${calculatedHmac} but got ${providedHmac}`,
        };
    }
    return undefined;
}
exports.validateNonce = validateNonce;
function generateNonce() {
    const randomString = (0, crypto_1.randomBytes)(16).toString("hex");
    return `${timestampInSeconds()}T${randomString}`;
}
exports.generateNonce = generateNonce;
function createNonceHmac(nonce, config) {
    return (0, crypto_1.createHmac)("sha256", config.nonceSigningSecret)
        .update(nonce)
        .digest("hex");
}
exports.createNonceHmac = createNonceHmac;
function timestampInSeconds() {
    return (Date.now() / 1000) | 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9uY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJub25jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBZ0Q7QUFHaEQsU0FBZ0IsYUFBYSxDQUMzQixLQUFhLEVBQ2IsTUFBYztJQUVkLCtCQUErQjtJQUMvQixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDOUQsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDcEIsT0FBTztZQUNMLFdBQVcsRUFBRSxlQUFlO1NBQzdCLENBQUE7S0FDRjtJQUVELElBQUksa0JBQWtCLEVBQUUsR0FBRyxTQUFTLEdBQUcsTUFBTSxFQUFFO1FBQzdDLE9BQU87WUFDTCxXQUFXLEVBQUUsbUNBQW1DLElBQUksSUFBSSxDQUN0RCxTQUFTLEdBQUcsSUFBSSxDQUNqQixDQUFDLFdBQVcsRUFBRSxHQUFHO1NBQ25CLENBQUE7S0FDRjtJQUVELE9BQU8sU0FBUyxDQUFBO0FBQ2xCLENBQUM7QUFyQkQsc0NBcUJDO0FBRUQsU0FBZ0IsYUFBYSxDQUMzQixLQUFhLEVBQ2IsWUFBb0IsRUFDcEIsTUFBYztJQUVkLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFBO0lBQ3JELElBQUksSUFBSSxFQUFFO1FBQ1IsT0FBTyxJQUFJLENBQUE7S0FDWjtJQUVELE1BQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDckQsSUFBSSxjQUFjLEtBQUssWUFBWSxFQUFFO1FBQ25DLE9BQU87WUFDTCxXQUFXLEVBQUUsc0NBQXNDLGNBQWMsWUFBWSxZQUFZLEVBQUU7U0FDNUYsQ0FBQTtLQUNGO0lBRUQsT0FBTyxTQUFTLENBQUE7QUFDbEIsQ0FBQztBQWxCRCxzQ0FrQkM7QUFFRCxTQUFnQixhQUFhO0lBQzNCLE1BQU0sWUFBWSxHQUFHLElBQUEsb0JBQVcsRUFBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDcEQsT0FBTyxHQUFHLGtCQUFrQixFQUFFLElBQUksWUFBWSxFQUFFLENBQUE7QUFDbEQsQ0FBQztBQUhELHNDQUdDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLEtBQWEsRUFBRSxNQUFjO0lBQzNELE9BQU8sSUFBQSxtQkFBVSxFQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsa0JBQWtCLENBQUM7U0FDbkQsTUFBTSxDQUFDLEtBQUssQ0FBQztTQUNiLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUNsQixDQUFDO0FBSkQsMENBSUM7QUFFRCxTQUFTLGtCQUFrQjtJQUN6QixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNoQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlSG1hYywgcmFuZG9tQnl0ZXMgfSBmcm9tIFwiY3J5cHRvXCJcbmltcG9ydCB7IENvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiXG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vbmNlQWdlKFxuICBub25jZTogc3RyaW5nLFxuICBtYXhBZ2U6IG51bWJlcixcbik6IHsgY2xpZW50RXJyb3I6IHN0cmluZyB9IHwgdW5kZWZpbmVkIHtcbiAgLy8gTm9uY2Ugc2hvdWxkIG5vdCBiZSB0b28gb2xkLlxuICBjb25zdCB0aW1lc3RhbXAgPSBwYXJzZUludChub25jZS5zbGljZSgwLCBub25jZS5pbmRleE9mKFwiVFwiKSkpXG4gIGlmIChpc05hTih0aW1lc3RhbXApKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsaWVudEVycm9yOiBcIkludmFsaWQgbm9uY2VcIixcbiAgICB9XG4gIH1cblxuICBpZiAodGltZXN0YW1wSW5TZWNvbmRzKCkgLSB0aW1lc3RhbXAgPiBtYXhBZ2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY2xpZW50RXJyb3I6IGBOb25jZSBpcyB0b28gb2xkIChub25jZSBpcyBmcm9tICR7bmV3IERhdGUoXG4gICAgICAgIHRpbWVzdGFtcCAqIDEwMDAsXG4gICAgICApLnRvSVNPU3RyaW5nKCl9KWAsXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVOb25jZShcbiAgbm9uY2U6IHN0cmluZyxcbiAgcHJvdmlkZWRIbWFjOiBzdHJpbmcsXG4gIGNvbmZpZzogQ29uZmlnLFxuKTogeyBjbGllbnRFcnJvcjogc3RyaW5nIH0gfCB1bmRlZmluZWQge1xuICBjb25zdCByZXMxID0gY2hlY2tOb25jZUFnZShub25jZSwgY29uZmlnLm5vbmNlTWF4QWdlKVxuICBpZiAocmVzMSkge1xuICAgIHJldHVybiByZXMxXG4gIH1cblxuICBjb25zdCBjYWxjdWxhdGVkSG1hYyA9IGNyZWF0ZU5vbmNlSG1hYyhub25jZSwgY29uZmlnKVxuICBpZiAoY2FsY3VsYXRlZEhtYWMgIT09IHByb3ZpZGVkSG1hYykge1xuICAgIHJldHVybiB7XG4gICAgICBjbGllbnRFcnJvcjogYE5vbmNlIHNpZ25hdHVyZSBtaXNtYXRjaCEgRXhwZWN0ZWQgJHtjYWxjdWxhdGVkSG1hY30gYnV0IGdvdCAke3Byb3ZpZGVkSG1hY31gLFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlTm9uY2UoKTogc3RyaW5nIHtcbiAgY29uc3QgcmFuZG9tU3RyaW5nID0gcmFuZG9tQnl0ZXMoMTYpLnRvU3RyaW5nKFwiaGV4XCIpXG4gIHJldHVybiBgJHt0aW1lc3RhbXBJblNlY29uZHMoKX1UJHtyYW5kb21TdHJpbmd9YFxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9uY2VIbWFjKG5vbmNlOiBzdHJpbmcsIGNvbmZpZzogQ29uZmlnKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNyZWF0ZUhtYWMoXCJzaGEyNTZcIiwgY29uZmlnLm5vbmNlU2lnbmluZ1NlY3JldClcbiAgICAudXBkYXRlKG5vbmNlKVxuICAgIC5kaWdlc3QoXCJoZXhcIilcbn1cblxuZnVuY3Rpb24gdGltZXN0YW1wSW5TZWNvbmRzKCkge1xuICByZXR1cm4gKERhdGUubm93KCkgLyAxMDAwKSB8IDBcbn1cbiJdfQ==