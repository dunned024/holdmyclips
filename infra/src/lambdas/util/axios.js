"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpPostWithRetry = void 0;
// Workaround for https://github.com/axios/axios/issues/3219
/// <reference lib="dom" />
const axios_1 = __importDefault(require("axios"));
const https_1 = require("https");
const axiosInstance = axios_1.default.create({
    httpsAgent: new https_1.Agent({ keepAlive: true }),
});
async function httpPostWithRetry(url, data, config, logger) {
    let attempts = 0;
    while (true) {
        ++attempts;
        try {
            return await axiosInstance.post(url, data, config);
        }
        catch (err) {
            logger.debug(`HTTP POST to ${url} failed (attempt ${attempts}):`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            logger.debug((err.response && err.response.data) || err);
            if (attempts >= 5) {
                // Try 5 times at most.
                logger.error(`No success after ${attempts} attempts, seizing further attempts`);
                throw err;
            }
            if (attempts >= 2) {
                // After attempting twice immediately, do some exponential backoff with jitter.
                logger.debug("Doing exponential backoff with jitter, before attempting HTTP POST again ...");
                await new Promise((resolve) => setTimeout(resolve, 25 * (Math.pow(2, attempts) + Math.random() * attempts)));
                logger.debug("Done waiting, will try HTTP POST again now");
            }
        }
    }
}
exports.httpPostWithRetry = httpPostWithRetry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXhpb3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJheGlvcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdURBQXVEO0FBQ3ZELHNFQUFzRTs7Ozs7O0FBRXRFLDREQUE0RDtBQUM1RCwyQkFBMkI7QUFFM0Isa0RBQWdFO0FBQ2hFLGlDQUE2QjtBQUc3QixNQUFNLGFBQWEsR0FBRyxlQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFVBQVUsRUFBRSxJQUFJLGFBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQztDQUMzQyxDQUFDLENBQUE7QUFFSyxLQUFLLFVBQVUsaUJBQWlCLENBQ3JDLEdBQVcsRUFDWCxJQUFTLEVBQ1QsTUFBMEIsRUFDMUIsTUFBYztJQUVkLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQTtJQUNoQixPQUFPLElBQUksRUFBRTtRQUNYLEVBQUUsUUFBUSxDQUFBO1FBQ1YsSUFBSTtZQUNGLE9BQU8sTUFBTSxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7U0FDbkQ7UUFBQyxPQUFPLEdBQVEsRUFBRTtZQUNqQixNQUFNLENBQUMsS0FBSyxDQUFDLGdCQUFnQixHQUFHLG9CQUFvQixRQUFRLElBQUksQ0FBQyxDQUFBO1lBQ2pFLHNFQUFzRTtZQUN0RSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFBO1lBQ3hELElBQUksUUFBUSxJQUFJLENBQUMsRUFBRTtnQkFDakIsdUJBQXVCO2dCQUN2QixNQUFNLENBQUMsS0FBSyxDQUNWLG9CQUFvQixRQUFRLHFDQUFxQyxDQUNsRSxDQUFBO2dCQUNELE1BQU0sR0FBRyxDQUFBO2FBQ1Y7WUFDRCxJQUFJLFFBQVEsSUFBSSxDQUFDLEVBQUU7Z0JBQ2pCLCtFQUErRTtnQkFDL0UsTUFBTSxDQUFDLEtBQUssQ0FDViw4RUFBOEUsQ0FDL0UsQ0FBQTtnQkFDRCxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FDNUIsVUFBVSxDQUNSLE9BQU8sRUFDUCxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQ3hELENBQ0YsQ0FBQTtnQkFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUE7YUFDM0Q7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQXJDRCw4Q0FxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55ICovXG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbW9kdWxlLWJvdW5kYXJ5LXR5cGVzICovXG5cbi8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9heGlvcy9heGlvcy9pc3N1ZXMvMzIxOVxuLy8vIDxyZWZlcmVuY2UgbGliPVwiZG9tXCIgLz5cblxuaW1wb3J0IGF4aW9zLCB7IEF4aW9zUmVxdWVzdENvbmZpZywgQXhpb3NSZXNwb25zZSB9IGZyb20gXCJheGlvc1wiXG5pbXBvcnQgeyBBZ2VudCB9IGZyb20gXCJodHRwc1wiXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9sb2dnZXJcIlxuXG5jb25zdCBheGlvc0luc3RhbmNlID0gYXhpb3MuY3JlYXRlKHtcbiAgaHR0cHNBZ2VudDogbmV3IEFnZW50KHsga2VlcEFsaXZlOiB0cnVlIH0pLFxufSlcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGh0dHBQb3N0V2l0aFJldHJ5KFxuICB1cmw6IHN0cmluZyxcbiAgZGF0YTogYW55LFxuICBjb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyxcbiAgbG9nZ2VyOiBMb2dnZXIsXG4pOiBQcm9taXNlPEF4aW9zUmVzcG9uc2U8YW55Pj4ge1xuICBsZXQgYXR0ZW1wdHMgPSAwXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgKythdHRlbXB0c1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgYXhpb3NJbnN0YW5jZS5wb3N0KHVybCwgZGF0YSwgY29uZmlnKVxuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBsb2dnZXIuZGVidWcoYEhUVFAgUE9TVCB0byAke3VybH0gZmFpbGVkIChhdHRlbXB0ICR7YXR0ZW1wdHN9KTpgKVxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnNhZmUtbWVtYmVyLWFjY2Vzc1xuICAgICAgbG9nZ2VyLmRlYnVnKChlcnIucmVzcG9uc2UgJiYgZXJyLnJlc3BvbnNlLmRhdGEpIHx8IGVycilcbiAgICAgIGlmIChhdHRlbXB0cyA+PSA1KSB7XG4gICAgICAgIC8vIFRyeSA1IHRpbWVzIGF0IG1vc3QuXG4gICAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgICBgTm8gc3VjY2VzcyBhZnRlciAke2F0dGVtcHRzfSBhdHRlbXB0cywgc2VpemluZyBmdXJ0aGVyIGF0dGVtcHRzYCxcbiAgICAgICAgKVxuICAgICAgICB0aHJvdyBlcnJcbiAgICAgIH1cbiAgICAgIGlmIChhdHRlbXB0cyA+PSAyKSB7XG4gICAgICAgIC8vIEFmdGVyIGF0dGVtcHRpbmcgdHdpY2UgaW1tZWRpYXRlbHksIGRvIHNvbWUgZXhwb25lbnRpYWwgYmFja29mZiB3aXRoIGppdHRlci5cbiAgICAgICAgbG9nZ2VyLmRlYnVnKFxuICAgICAgICAgIFwiRG9pbmcgZXhwb25lbnRpYWwgYmFja29mZiB3aXRoIGppdHRlciwgYmVmb3JlIGF0dGVtcHRpbmcgSFRUUCBQT1NUIGFnYWluIC4uLlwiLFxuICAgICAgICApXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PlxuICAgICAgICAgIHNldFRpbWVvdXQoXG4gICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgMjUgKiAoTWF0aC5wb3coMiwgYXR0ZW1wdHMpICsgTWF0aC5yYW5kb20oKSAqIGF0dGVtcHRzKSxcbiAgICAgICAgICApLFxuICAgICAgICApXG4gICAgICAgIGxvZ2dlci5kZWJ1ZyhcIkRvbmUgd2FpdGluZywgd2lsbCB0cnkgSFRUUCBQT1NUIGFnYWluIG5vd1wiKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19