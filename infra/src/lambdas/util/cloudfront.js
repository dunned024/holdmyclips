"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponseHandler = exports.createRequestHandler = exports.staticPage = exports.redirectTo = void 0;
const template_html_1 = __importDefault(require("../error-page/template.html"));
const config_1 = require("./config");
function asCloudFrontHeaders(headers) {
    return Object.entries(headers).reduce((reduced, [key, value]) => Object.assign(reduced, {
        [key.toLowerCase()]: [
            {
                key,
                value,
            },
        ],
    }), {});
}
function redirectTo(path, props) {
    const headers = props?.cookies
        ? {
            "set-cookie": props.cookies.map((value) => ({
                key: "set-cookie",
                value,
            })),
        }
        : {};
    return {
        status: "307",
        statusDescription: "Temporary Redirect",
        headers: {
            location: [
                {
                    key: "location",
                    value: path,
                },
            ],
            ...headers,
        },
    };
}
exports.redirectTo = redirectTo;
function staticPage(props) {
    return {
        body: createErrorHtml(props),
        status: props.statusCode ?? "500",
        headers: {
            "content-type": [
                {
                    key: "Content-Type",
                    value: "text/html; charset=UTF-8",
                },
            ],
        },
    };
}
exports.staticPage = staticPage;
function createErrorHtml(props) {
    const params = { ...props, region: process.env.AWS_REGION };
    return template_html_1.default.replace(/\${([^}]*)}/g, (_, v) => params[v] || "");
}
function addCloudFrontHeaders(config, response) {
    if (!response) {
        throw new Error("Expected response value");
    }
    return {
        ...response,
        headers: {
            ...(response.headers ?? {}),
            ...asCloudFrontHeaders(config.httpHeaders),
        },
    };
}
function createRequestHandler(inner) {
    let config;
    return async (event) => {
        if (!config) {
            config = (0, config_1.getConfig)();
        }
        config.logger.debug("Handling event:", event);
        const response = addCloudFrontHeaders(config, await inner(config, event));
        config.logger.debug("Returning response:", response);
        return response;
    };
}
exports.createRequestHandler = createRequestHandler;
function createResponseHandler(inner) {
    let config;
    return async (event) => {
        if (!config) {
            config = (0, config_1.getConfig)();
        }
        config.logger.debug("Handling event:", event);
        const response = addCloudFrontHeaders(config, await inner(config, event));
        config.logger.debug("Returning response:", response);
        return response;
    };
}
exports.createResponseHandler = createResponseHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWRmcm9udC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsb3VkZnJvbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBU0EsZ0ZBQThDO0FBQzlDLHFDQUE0QztBQUk1QyxTQUFTLG1CQUFtQixDQUFDLE9BQW9CO0lBQy9DLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQ25DLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FDeEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDckIsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRTtZQUNuQjtnQkFDRSxHQUFHO2dCQUNILEtBQUs7YUFDTjtTQUNGO0tBQ0YsQ0FBQyxFQUNKLEVBQXVCLENBQ3hCLENBQUE7QUFDSCxDQUFDO0FBRUQsU0FBZ0IsVUFBVSxDQUN4QixJQUFZLEVBQ1osS0FFQztJQUVELE1BQU0sT0FBTyxHQUFzQixLQUFLLEVBQUUsT0FBTztRQUMvQyxDQUFDLENBQUM7WUFDRSxZQUFZLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQzFDLEdBQUcsRUFBRSxZQUFZO2dCQUNqQixLQUFLO2FBQ04sQ0FBQyxDQUFDO1NBQ0o7UUFDSCxDQUFDLENBQUMsRUFBRSxDQUFBO0lBRU4sT0FBTztRQUNMLE1BQU0sRUFBRSxLQUFLO1FBQ2IsaUJBQWlCLEVBQUUsb0JBQW9CO1FBQ3ZDLE9BQU8sRUFBRTtZQUNQLFFBQVEsRUFBRTtnQkFDUjtvQkFDRSxHQUFHLEVBQUUsVUFBVTtvQkFDZixLQUFLLEVBQUUsSUFBSTtpQkFDWjthQUNGO1lBQ0QsR0FBRyxPQUFPO1NBQ1g7S0FDRixDQUFBO0FBQ0gsQ0FBQztBQTVCRCxnQ0E0QkM7QUFFRCxTQUFnQixVQUFVLENBQUMsS0FPMUI7SUFDQyxPQUFPO1FBQ0wsSUFBSSxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFDNUIsTUFBTSxFQUFFLEtBQUssQ0FBQyxVQUFVLElBQUksS0FBSztRQUNqQyxPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsR0FBRyxFQUFFLGNBQWM7b0JBQ25CLEtBQUssRUFBRSwwQkFBMEI7aUJBQ2xDO2FBQ0Y7U0FDRjtLQUNGLENBQUE7QUFDSCxDQUFDO0FBcEJELGdDQW9CQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBTXhCO0lBQ0MsTUFBTSxNQUFNLEdBQUcsRUFBRSxHQUFHLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQTtJQUMzRCxPQUFPLHVCQUFJLENBQUMsT0FBTyxDQUNqQixjQUFjLEVBQ2QsQ0FBQyxDQUFDLEVBQUUsQ0FBc0IsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FDL0MsQ0FBQTtBQUNILENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUUzQixNQUFjLEVBQUUsUUFBVztJQUMzQixJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO0tBQzNDO0lBRUQsT0FBTztRQUNMLEdBQUcsUUFBUTtRQUNYLE9BQU8sRUFBRTtZQUNQLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUMzQixHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7U0FDM0M7S0FDRixDQUFBO0FBQ0gsQ0FBQztBQU9ELFNBQWdCLG9CQUFvQixDQUNsQyxLQUFxQjtJQUVyQixJQUFJLE1BQWMsQ0FBQTtJQUVsQixPQUFPLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUNyQixJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsTUFBTSxHQUFHLElBQUEsa0JBQVMsR0FBRSxDQUFBO1NBQ3JCO1FBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFFN0MsTUFBTSxRQUFRLEdBQUcsb0JBQW9CLENBQUMsTUFBTSxFQUFFLE1BQU0sS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFBO1FBRXpFLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ3BELE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUMsQ0FBQTtBQUNILENBQUM7QUFqQkQsb0RBaUJDO0FBRUQsU0FBZ0IscUJBQXFCLENBQ25DLEtBR3NDO0lBRXRDLElBQUksTUFBYyxDQUFBO0lBRWxCLE9BQU8sS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxNQUFNLEdBQUcsSUFBQSxrQkFBUyxHQUFFLENBQUE7U0FDckI7UUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUU3QyxNQUFNLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUE7UUFFekUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDcEQsT0FBTyxRQUFRLENBQUE7SUFDakIsQ0FBQyxDQUFBO0FBQ0gsQ0FBQztBQXBCRCxzREFvQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDbG91ZEZyb250SGVhZGVycyxcbiAgQ2xvdWRGcm9udFJlcXVlc3RFdmVudCxcbiAgQ2xvdWRGcm9udFJlcXVlc3RIYW5kbGVyLFxuICBDbG91ZEZyb250UmVxdWVzdFJlc3VsdCxcbiAgQ2xvdWRGcm9udFJlc3BvbnNlRXZlbnQsXG4gIENsb3VkRnJvbnRSZXNwb25zZUhhbmRsZXIsXG4gIENsb3VkRnJvbnRSZXNwb25zZVJlc3VsdCxcbn0gZnJvbSBcImF3cy1sYW1iZGFcIlxuaW1wb3J0IGh0bWwgZnJvbSBcIi4uL2Vycm9yLXBhZ2UvdGVtcGxhdGUuaHRtbFwiXG5pbXBvcnQgeyBDb25maWcsIGdldENvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiXG5cbmV4cG9ydCB0eXBlIEh0dHBIZWFkZXJzID0gUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuXG5mdW5jdGlvbiBhc0Nsb3VkRnJvbnRIZWFkZXJzKGhlYWRlcnM6IEh0dHBIZWFkZXJzKTogQ2xvdWRGcm9udEhlYWRlcnMge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMoaGVhZGVycykucmVkdWNlKFxuICAgIChyZWR1Y2VkLCBba2V5LCB2YWx1ZV0pID0+XG4gICAgICBPYmplY3QuYXNzaWduKHJlZHVjZWQsIHtcbiAgICAgICAgW2tleS50b0xvd2VyQ2FzZSgpXTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICB7fSBhcyBDbG91ZEZyb250SGVhZGVycyxcbiAgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVkaXJlY3RUbyhcbiAgcGF0aDogc3RyaW5nLFxuICBwcm9wcz86IHtcbiAgICBjb29raWVzPzogc3RyaW5nW11cbiAgfSxcbik6IENsb3VkRnJvbnRSZXNwb25zZVJlc3VsdCB7XG4gIGNvbnN0IGhlYWRlcnM6IENsb3VkRnJvbnRIZWFkZXJzID0gcHJvcHM/LmNvb2tpZXNcbiAgICA/IHtcbiAgICAgICAgXCJzZXQtY29va2llXCI6IHByb3BzLmNvb2tpZXMubWFwKCh2YWx1ZSkgPT4gKHtcbiAgICAgICAgICBrZXk6IFwic2V0LWNvb2tpZVwiLFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICB9KSksXG4gICAgICB9XG4gICAgOiB7fVxuXG4gIHJldHVybiB7XG4gICAgc3RhdHVzOiBcIjMwN1wiLFxuICAgIHN0YXR1c0Rlc2NyaXB0aW9uOiBcIlRlbXBvcmFyeSBSZWRpcmVjdFwiLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIGxvY2F0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBrZXk6IFwibG9jYXRpb25cIixcbiAgICAgICAgICB2YWx1ZTogcGF0aCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICAuLi5oZWFkZXJzLFxuICAgIH0sXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXRpY1BhZ2UocHJvcHM6IHtcbiAgdGl0bGU6IHN0cmluZ1xuICBtZXNzYWdlOiBzdHJpbmdcbiAgZGV0YWlsczogc3RyaW5nXG4gIGxpbmtIcmVmOiBzdHJpbmdcbiAgbGlua1RleHQ6IHN0cmluZ1xuICBzdGF0dXNDb2RlPzogc3RyaW5nXG59KTogQ2xvdWRGcm9udFJlc3BvbnNlUmVzdWx0IHtcbiAgcmV0dXJuIHtcbiAgICBib2R5OiBjcmVhdGVFcnJvckh0bWwocHJvcHMpLFxuICAgIHN0YXR1czogcHJvcHMuc3RhdHVzQ29kZSA/PyBcIjUwMFwiLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIFwiY29udGVudC10eXBlXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIGtleTogXCJDb250ZW50LVR5cGVcIixcbiAgICAgICAgICB2YWx1ZTogXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVFcnJvckh0bWwocHJvcHM6IHtcbiAgdGl0bGU6IHN0cmluZ1xuICBtZXNzYWdlOiBzdHJpbmdcbiAgZGV0YWlsczogc3RyaW5nXG4gIGxpbmtIcmVmOiBzdHJpbmdcbiAgbGlua1RleHQ6IHN0cmluZ1xufSk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcmFtcyA9IHsgLi4ucHJvcHMsIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTiB9XG4gIHJldHVybiBodG1sLnJlcGxhY2UoXG4gICAgL1xcJHsoW159XSopfS9nLFxuICAgIChfLCB2OiBrZXlvZiB0eXBlb2YgcGFyYW1zKSA9PiBwYXJhbXNbdl0gfHwgXCJcIixcbiAgKVxufVxuXG5mdW5jdGlvbiBhZGRDbG91ZEZyb250SGVhZGVyczxcbiAgVCBleHRlbmRzIENsb3VkRnJvbnRSZXF1ZXN0UmVzdWx0IHwgQ2xvdWRGcm9udFJlc3BvbnNlUmVzdWx0LFxuPihjb25maWc6IENvbmZpZywgcmVzcG9uc2U6IFQpOiBUIHtcbiAgaWYgKCFyZXNwb25zZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIHJlc3BvbnNlIHZhbHVlXCIpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIC4uLnJlc3BvbnNlLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIC4uLihyZXNwb25zZS5oZWFkZXJzID8/IHt9KSxcbiAgICAgIC4uLmFzQ2xvdWRGcm9udEhlYWRlcnMoY29uZmlnLmh0dHBIZWFkZXJzKSxcbiAgICB9LFxuICB9XG59XG5cbmV4cG9ydCB0eXBlIFJlcXVlc3RIYW5kbGVyID0gKFxuICBjb25maWc6IENvbmZpZyxcbiAgZXZlbnQ6IENsb3VkRnJvbnRSZXF1ZXN0RXZlbnQsXG4pID0+IFByb21pc2U8Q2xvdWRGcm9udFJlcXVlc3RSZXN1bHQ+XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZXF1ZXN0SGFuZGxlcihcbiAgaW5uZXI6IFJlcXVlc3RIYW5kbGVyLFxuKTogQ2xvdWRGcm9udFJlcXVlc3RIYW5kbGVyIHtcbiAgbGV0IGNvbmZpZzogQ29uZmlnXG5cbiAgcmV0dXJuIGFzeW5jIChldmVudCkgPT4ge1xuICAgIGlmICghY29uZmlnKSB7XG4gICAgICBjb25maWcgPSBnZXRDb25maWcoKVxuICAgIH1cblxuICAgIGNvbmZpZy5sb2dnZXIuZGVidWcoXCJIYW5kbGluZyBldmVudDpcIiwgZXZlbnQpXG5cbiAgICBjb25zdCByZXNwb25zZSA9IGFkZENsb3VkRnJvbnRIZWFkZXJzKGNvbmZpZywgYXdhaXQgaW5uZXIoY29uZmlnLCBldmVudCkpXG5cbiAgICBjb25maWcubG9nZ2VyLmRlYnVnKFwiUmV0dXJuaW5nIHJlc3BvbnNlOlwiLCByZXNwb25zZSlcbiAgICByZXR1cm4gcmVzcG9uc2VcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVzcG9uc2VIYW5kbGVyKFxuICBpbm5lcjogKFxuICAgIGNvbmZpZzogQ29uZmlnLFxuICAgIGV2ZW50OiBDbG91ZEZyb250UmVzcG9uc2VFdmVudCxcbiAgKSA9PiBQcm9taXNlPENsb3VkRnJvbnRSZXNwb25zZVJlc3VsdD4sXG4pOiBDbG91ZEZyb250UmVzcG9uc2VIYW5kbGVyIHtcbiAgbGV0IGNvbmZpZzogQ29uZmlnXG5cbiAgcmV0dXJuIGFzeW5jIChldmVudCkgPT4ge1xuICAgIGlmICghY29uZmlnKSB7XG4gICAgICBjb25maWcgPSBnZXRDb25maWcoKVxuICAgIH1cblxuICAgIGNvbmZpZy5sb2dnZXIuZGVidWcoXCJIYW5kbGluZyBldmVudDpcIiwgZXZlbnQpXG5cbiAgICBjb25zdCByZXNwb25zZSA9IGFkZENsb3VkRnJvbnRIZWFkZXJzKGNvbmZpZywgYXdhaXQgaW5uZXIoY29uZmlnLCBldmVudCkpXG5cbiAgICBjb25maWcubG9nZ2VyLmRlYnVnKFwiUmV0dXJuaW5nIHJlc3BvbnNlOlwiLCByZXNwb25zZSlcbiAgICByZXR1cm4gcmVzcG9uc2VcbiAgfVxufVxuIl19