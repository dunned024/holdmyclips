'use strict';
import { SSM } from '@aws-sdk/client-ssm';

const ssm = new SSM();


export const handler = async (event, context, callback) => {
    // Get request and request headers
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Configure authentication
    // let rawAuth;
    const rawAuth = await ssm.getParameter({
        Name: 'hold-my-clips-basic-auth',
        WithDecryption: true,
    })

    // Construct the Basic Auth string
    const authString = 'Basic ' + Buffer.from(rawAuth.Parameter.Value).toString('base64');

    // Require Basic authentication
    if (typeof headers.authorization == 'undefined' || headers.authorization[0].value != authString) {
        const body = 'Unauthorized';
        const response = {
            status: '401',
            statusDescription: 'Unauthorized',
            body: body,
            headers: {
                'www-authenticate': [{key: 'WWW-Authenticate', value:'Basic'}]
            },
        };
        callback(null, response);
    }

    // Continue request processing if authentication passed
    callback(null, request);
}
