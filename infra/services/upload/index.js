'use strict';
import { S3 } from '@aws-sdk/client-s3'
import * as parser from 'lambda-multipart-parser'
import pkg from 'busboy';
const busboy = pkg;


export const handler = async (event, context, callback) => {
    console.log('stepping in')
    console.log('event: ')
    console.log(event)
    const s3 = new S3();
    const uploadBucket = 'hold-my-clips'
    console.log('event.Records[0]: ')
    console.log(event.Records[0])
    console.log('event.Records[0].cf: ')
    console.log(event.Records[0].cf)
    const request = event.Records[0].cf;
    console.log(request)
    // Get request and request headers
    const result = await parse(request);
    console.log(request)

    if (request.httpMethod === 'POST') {
        console.log(result)
        const files = result.files;
        delete result.files;

        const id = result['id'];
        console.log(JSON.stringify(result))
        
        s3.putObject({
            Bucket: uploadBucket,
            Key: `clips/${id}/${id}.json`, 
            Body: JSON.stringify(result),
            ContentType: 'application/json'},
            function (err,data) {
              console.log(JSON.stringify(err) + ' ' + JSON.stringify(data));
            }
          );
        
        s3.putObject({ 
            Bucket: uploadBucket, 
            Key: `clips/${id}/${id}.mp4`,
            Body: files[0]?.content }
        );

    }
    
    callback(null, request);
}


const parse = (request) => new Promise((resolve, reject) => {
    console.log('request.headers["content-type"]: ')
    console.log(request.headers['content-type'])
    const cfg = {
        headers: {
            'content-type': request.headers['content-type']
        }
    }
    console.log('cfg: ')
    console.log(cfg)

    console.log('typeof cfg (should be object): ' + typeof cfg)
    console.log('typeof cfg.headers (should be object): ' + typeof cfg.headers)
    console.log('typeof cfg.headers["content-type"] (should be string): ' + typeof cfg.headers['content-type'])
    // console.log('body: ')
    // console.log(event.body)
    // const parsedBodyData = new Buffer.from(event.body, 'base64').toString("utf-8");
    // console.log('parsedBodyData: ')
    // console.log(parsedBodyData)

    console.log('next: ')

    const bb = busboy(cfg);
    const result = {
        files: []
    };

    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const uploadFile = {};

        file.on('data', data => {
            uploadFile.content = data;
        });

        file.on('error', function(error) {
            reject(error);
        })
        
        file.on('end', () => {
            if (uploadFile.content) {
                uploadFile.filename = filename;
                uploadFile.contentType = mimetype;
                uploadFile.encoding = encoding;
                uploadFile.fieldname = fieldname;
                result.files.push(uploadFile);
            }
        });

    });

    bb.on('field', (fieldname, value) => {
        result[fieldname] = value;
    });

    bb.on('error', error => {
        reject(error);
    });

    bb.on('finish', () => {
        resolve(result);
    });

    bb.on('close', () => {
        resolve(result);
        console.log('Done parsing form!');
    });

    const encoding = request.encoding || (request.isBase64Encoded ? "base64" : "binary");
    // const buf = Buffer.from(event.body, 'base64').toString('utf-8')
    // console.log(buf)

    bb.write(request.body, encoding);

    try {
        console.log('try')
        bb.end();
    } catch {
        console.log('catch')
        resolve(result)
        
        console.log('resolve')
        bb.end();
    }
});

// const event = {
//   "Records": [
//     {
//       "cf": {
//             resource: '/upload',
//             path: '/upload',
//             httpMethod: 'POST',
//             headers: {
//             'accept-encoding': 'gzip, deflate, br',
//             'CloudFront-Forwarded-Proto': 'https',
//             'CloudFront-Is-Desktop-Viewer': 'true',
//             'CloudFront-Is-Mobile-Viewer': 'false',
//             'CloudFront-Is-SmartTV-Viewer': 'false',
//             'CloudFront-Is-Tablet-Viewer': 'false',
//             'CloudFront-Viewer-ASN': '14618',
//             'CloudFront-Viewer-Country': 'US',
//             'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryjWKOIWZAA7bguzzQ',
//             Host: 'cvj1vjjp8k.execute-api.us-east-1.amazonaws.com',
//             origin: 'https://clips.dunned024.com',
//             'User-Agent': 'Amazon CloudFront',
//             Via: '1.1 259504331979f04d1452bf27a511bc6e.cloudfront.net (CloudFront), 1.1 126bc2e5c4c1b9ac0ffa004edc6f02c4.cloudfront.net (CloudFront)',
//             'X-Amz-Cf-Id': 'U4hDVmIiUOmokmunRakqIY26mGdtH7M6z11HepaPzvplor78svusgA==',
//             'X-Amzn-Trace-Id': 'Root=1-647222bc-008eb2db58db95e0651ce25b',
//             'X-Forwarded-For': '216.211.242.185, 64.252.66.43, 130.176.179.10',
//             'X-Forwarded-Port': '443',
//             'X-Forwarded-Proto': 'https'
//             },
//             multiValueHeaders: {
//             'accept-encoding': [ 'gzip, deflate, br' ],
//             'CloudFront-Forwarded-Proto': [ 'https' ],
//             'CloudFront-Is-Desktop-Viewer': [ 'true' ],
//             'CloudFront-Is-Mobile-Viewer': [ 'false' ],
//             'CloudFront-Is-SmartTV-Viewer': [ 'false' ],
//             'CloudFront-Is-Tablet-Viewer': [ 'false' ],
//             'CloudFront-Viewer-ASN': [ '14618' ],
//             'CloudFront-Viewer-Country': [ 'US' ],
//             'content-type': [
//                 'multipart/form-data; boundary=----WebKitFormBoundaryjWKOIWZAA7bguzzQ'
//             ],
//             Host: [ 'cvj1vjjp8k.execute-api.us-east-1.amazonaws.com' ],
//             origin: [ 'https://clips.dunned024.com' ],
//             'User-Agent': [ 'Amazon CloudFront' ],
//             Via: [
//                 '1.1 259504331979f04d1452bf27a511bc6e.cloudfront.net (CloudFront), 1.1 126bc2e5c4c1b9ac0ffa004edc6f02c4.cloudfront.net (CloudFront)'
//             ],
//             'X-Amz-Cf-Id': [ 'U4hDVmIiUOmokmunRakqIY26mGdtH7M6z11HepaPzvplor78svusgA==' ],
//             'X-Amzn-Trace-Id': [ 'Root=1-647222bc-008eb2db58db95e0651ce25b' ],
//             'X-Forwarded-For': [ '216.211.242.185, 64.252.66.43, 130.176.179.10' ],
//             'X-Forwarded-Port': [ '443' ],
//             'X-Forwarded-Proto': [ 'https' ]
//             },
//             queryStringParameters: null,
//             multiValueQueryStringParameters: null,
//             pathParameters: null,
//             stageVariables: null,
//             requestContext: {
//             resourceId: '76yh0r',
//             resourcePath: '/upload',
//             httpMethod: 'POST',
//             extendedRequestId: 'FlpdfEsnIAMF5wA=',
//             requestTime: '27/May/2023:15:33:16 +0000',
//             path: '/prod/upload',
//             accountId: '879223189443',
//             protocol: 'HTTP/1.1',
//             stage: 'prod',
//             domainPrefix: 'cvj1vjjp8k',
//             requestTimeEpoch: 1685201596404,
//             requestId: 'fcf845b9-72ac-4da0-b436-e6447abb6914',
//             identity: {
//                 cognitoIdentityPoolId: null,
//                 accountId: null,
//                 cognitoIdentityId: null,
//                 caller: null,
//                 sourceIp: '64.252.66.43',
//                 principalOrgId: null,
//                 accessKey: null,
//                 cognitoAuthenticationType: null,
//                 cognitoAuthenticationProvider: null,
//                 userArn: null,
//                 userAgent: 'Amazon CloudFront',
//                 user: null
//             },
//             domainName: 'cvj1vjjp8k.execute-api.us-east-1.amazonaws.com',
//             apiId: 'cvj1vjjp8k'
//             },
//             body: '------WebKitFormBoundaryjWKOIWZAA7bguzzQ\r\n' +
//             'Content-Disposition: form-data; name="title"\r\n' +
//             '\r\n' +
//             'Apex Legends 2023-05-17 21-41-41.mp4\r\n' +
//             '------WebKitFormBoundaryjWKOIWZAA7bguzzQ\r\n' +
//             'Content-Disposition: form-data; name="uploader"\r\n' +
//             '\r\n' +
//             'a\r\n' +
//             '------WebKitFormBoundaryjWKOIWZAA7bguzzQ\r\n' +
//             'Content-Disposition: form-data; name="description"\r\n' +
//             '\r\n' +
//             '\r\n' +
//             '------WebKitFormBoundaryjWKOIWZAA7bguzzQ\r\n' +
//             'Content-Disposition: form-data; name="id"\r\n' +
//             '\r\n' +
//             'light-cloth\r\n' +
//             '------WebKitFormBoundaryjWKOIWZAA7bguzzQ\r\n' +
//             'Content-Disposition: form-data; name="duration"\r\n' +
//             '\r\n' +
//             '30.352717\r\n' +
//             '------WebKitFormBoundaryjWKOIWZAA7bguzzQ\r\n' +
//             'Content-Disposition: form-data; name="views"\r\n' +
//             '\r\n' +
//             '0\r\n' +
//             '------WebKitFormBoundaryjWKOIWZAA7bguzzQ\r\n' +
//             'Content-Disposition: form-data; name="comments"\r\n' +
//             '\r\n' +
//             '[]\r\n' +
//             '------WebKitFormBoundaryjWKOIWZAA7bguzzQ--\r\n',
//             isBase64Encoded: false
//         }
//         }
//   ]
// }
  
// const response = handler(event, '', () => null);

  