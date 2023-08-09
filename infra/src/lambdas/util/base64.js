"use strict";
/*
Functions to translate base64-encoded strings, so they can be used:

  - in URL's without needing additional encoding
  - in OAuth2 PKCE verifier
  - in cookies (to be on the safe side, as = + / are in fact valid characters in cookies)
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeSafeBase64 = exports.safeBase64Stringify = void 0;
/**
 * Use this on a base64-encoded string to translate = + / into replacement characters.
 */
function safeBase64Stringify(value) {
    return value.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
exports.safeBase64Stringify = safeBase64Stringify;
/**
 * Decode a Base64 value that is run through safeBase64Stringify to the actual string.
 */
function decodeSafeBase64(value) {
    const desafed = value.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(desafed, "base64").toString();
}
exports.decodeSafeBase64 = decodeSafeBase64;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZTY0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmFzZTY0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0VBTUU7OztBQUVGOztHQUVHO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQUMsS0FBYTtJQUMvQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUN4RSxDQUFDO0FBRkQsa0RBRUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLGdCQUFnQixDQUFDLEtBQWE7SUFDNUMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUMzRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO0FBQ2xELENBQUM7QUFIRCw0Q0FHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5GdW5jdGlvbnMgdG8gdHJhbnNsYXRlIGJhc2U2NC1lbmNvZGVkIHN0cmluZ3MsIHNvIHRoZXkgY2FuIGJlIHVzZWQ6XG5cbiAgLSBpbiBVUkwncyB3aXRob3V0IG5lZWRpbmcgYWRkaXRpb25hbCBlbmNvZGluZ1xuICAtIGluIE9BdXRoMiBQS0NFIHZlcmlmaWVyXG4gIC0gaW4gY29va2llcyAodG8gYmUgb24gdGhlIHNhZmUgc2lkZSwgYXMgPSArIC8gYXJlIGluIGZhY3QgdmFsaWQgY2hhcmFjdGVycyBpbiBjb29raWVzKVxuKi9cblxuLyoqXG4gKiBVc2UgdGhpcyBvbiBhIGJhc2U2NC1lbmNvZGVkIHN0cmluZyB0byB0cmFuc2xhdGUgPSArIC8gaW50byByZXBsYWNlbWVudCBjaGFyYWN0ZXJzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FmZUJhc2U2NFN0cmluZ2lmeSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLz0vZywgXCJcIikucmVwbGFjZSgvXFwrL2csIFwiLVwiKS5yZXBsYWNlKC9cXC8vZywgXCJfXCIpXG59XG5cbi8qKlxuICogRGVjb2RlIGEgQmFzZTY0IHZhbHVlIHRoYXQgaXMgcnVuIHRocm91Z2ggc2FmZUJhc2U2NFN0cmluZ2lmeSB0byB0aGUgYWN0dWFsIHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVNhZmVCYXNlNjQodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGRlc2FmZWQgPSB2YWx1ZS5yZXBsYWNlKC8tL2csIFwiK1wiKS5yZXBsYWNlKC9fL2csIFwiL1wiKVxuICByZXR1cm4gQnVmZmVyLmZyb20oZGVzYWZlZCwgXCJiYXNlNjRcIikudG9TdHJpbmcoKVxufVxuIl19