'use strict';
import { CloudFormation } from '@aws-sdk/client-cloudformation'
import { CloudFront } from '@aws-sdk/client-cloudfront'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { S3 } from '@aws-sdk/client-s3'
import * as parser from 'aws-lambda-multipart-parser';


export const handler = async (event, context, callback) => {
    console.log('event: ')
    console.log(event)

    if (event.httpMethod === 'PUT') {

        const parsedData = parser.parse(event);
        console.log(parsedData)

        const id = parsedData['id'];
        
        const s3 = new S3();
        s3.putObject({
            Bucket: 'hold-my-clips',
            Key: `clips/${id}/${id}.json`, 
            Body: JSON.stringify(parsedData),
            ContentType: 'application/json'},
            function (err,data) {
                console.log(JSON.stringify(err) + ' ' + JSON.stringify(data));
            }
          );
        
        storeIndexRecord(id, parsedData)
        invalidateDistributionPath();
    }
    
    callback(null, event);
}

const storeIndexRecord = async (id, parsedData) => {
    const indexItem = {};

    indexItem['id'] = {S: id};
    indexItem['title'] = {S: parsedData['title']};
    indexItem['uploader'] = {S: parsedData['uploader']};
    indexItem['description'] = {S: parsedData['description']};
    indexItem['duration'] = {N: parsedData['duration']};

    const tableName = await _getStackOutput('HMCClipdex', 'ClipdexTableName')
    console.log(tableName)
    
    const putParams = {
        TableName: tableName,
        Item: indexItem
    };

    const dynamodb = new DynamoDB();
    await dynamodb.putItem(putParams);
}

const invalidateDistributionPath = async () => {
    const distributionId = await _getStackOutput('HMCStaticSite', 'StaticSiteDistributionId');
    console.log(distributionId)

    const callerReference = new Date().toISOString().replace(/\:|\-|\./g, '')
    console.log(callerReference)
    const invalidationParams = {
        DistributionId: distributionId,
        InvalidationBatch: {
            Paths: {
                Quantity: 2,
                Items: ['/', '/clips']
            },
            CallerReference: callerReference
        },
    };

    const cloudFront = new CloudFront();
    cloudFront.createInvalidation(invalidationParams, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data)
    })
}

const _getStackOutput = (stackName, outputKey) => new Promise((resolve, reject) => {
    const cloudFormation = new CloudFormation();

    cloudFormation.describeStacks({StackName: stackName}, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            reject(err)
        } else {
            const stackOutputs = data.Stacks[0].Outputs
            const output = stackOutputs.find(o => o.OutputKey === outputKey)['OutputValue'];
            resolve(output)
        }
    })

})


// const event = {
//     resource: '/upload',
//     path: '/upload',
//     httpMethod: 'PUT',
//     headers: {
//       'Accept-Encoding': 'gzip, deflate, br',
//       'CloudFront-Forwarded-Proto': 'https',
//       'CloudFront-Is-Desktop-Viewer': 'true',
//       'CloudFront-Is-Mobile-Viewer': 'false',
//       'CloudFront-Is-SmartTV-Viewer': 'false',
//       'CloudFront-Is-Tablet-Viewer': 'false',
//       'CloudFront-Viewer-ASN': '16509',
//       'CloudFront-Viewer-Country': 'US',
//       'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryRl9TN4rPVuSPUEBm',
//       Host: 'a4z0r0cc1c.execute-api.us-east-1.amazonaws.com',
//       origin: 'https://clips.dunned024.com',
//       'User-Agent': 'Amazon CloudFront',
//       Via: '2.0 345e58b151dd5a8ce47c17921388574a.cloudfront.net (CloudFront), 1.1 d50d90bbddca57e02d6288d86c88470a.cloudfront.net (CloudFront)',
//       'X-Amz-Cf-Id': 'pzIbNnQ2mkke7Esw10jBioJMSSd4wCLhLzBZ98TaYJYjY3f3493spw==',
//       'X-Amzn-Trace-Id': 'Root=1-6474b9fd-1ff2a770550fe76c2911f41a',
//       'X-Forwarded-For': '216.211.242.185, 130.176.116.74, 15.158.35.87',
//       'X-Forwarded-Port': '443',
//       'X-Forwarded-Proto': 'https'
//     },
//     multiValueHeaders: {
//       'Accept-Encoding': [ 'gzip, deflate, br' ],
//       'CloudFront-Forwarded-Proto': [ 'https' ],
//       'CloudFront-Is-Desktop-Viewer': [ 'true' ],
//       'CloudFront-Is-Mobile-Viewer': [ 'false' ],
//       'CloudFront-Is-SmartTV-Viewer': [ 'false' ],
//       'CloudFront-Is-Tablet-Viewer': [ 'false' ],
//       'CloudFront-Viewer-ASN': [ '16509' ],
//       'CloudFront-Viewer-Country': [ 'US' ],
//       'content-type': [
//         'multipart/form-data; boundary=----WebKitFormBoundaryRl9TN4rPVuSPUEBm'
//       ],
//       Host: [ 'a4z0r0cc1c.execute-api.us-east-1.amazonaws.com' ],
//       origin: [ 'https://clips.dunned024.com' ],
//       'User-Agent': [ 'Amazon CloudFront' ],
//       Via: [
//         '2.0 345e58b151dd5a8ce47c17921388574a.cloudfront.net (CloudFront), 1.1 d50d90bbddca57e02d6288d86c88470a.cloudfront.net (CloudFront)'
//       ],
//       'X-Amz-Cf-Id': [ 'pzIbNnQ2mkke7Esw10jBioJMSSd4wCLhLzBZ98TaYJYjY3f3493spw==' ],
//       'X-Amzn-Trace-Id': [ 'Root=1-6474b9fd-1ff2a770550fe76c2911f41a' ],
//       'X-Forwarded-For': [ '216.211.242.185, 130.176.116.74, 15.158.35.87' ],
//       'X-Forwarded-Port': [ '443' ],
//       'X-Forwarded-Proto': [ 'https' ]
//     },
//     queryStringParameters: null,
//     multiValueQueryStringParameters: null,
//     pathParameters: null,
//     stageVariables: null,
//     requestContext: {
//       resourceId: 'xkgetu',
//       resourcePath: '/upload',
//       httpMethod: 'PUT',
//       extendedRequestId: 'FsH_lG-hIAMFh8g=',
//       requestTime: '29/May/2023:14:43:09 +0000',
//       path: '/prod/upload',
//       accountId: '879223189443',
//       protocol: 'HTTP/1.1',
//       stage: 'prod',
//       domainPrefix: 'a4z0r0cc1c',
//       requestTimeEpoch: 1685371389044,
//       requestId: '2f62e926-f9a2-44c3-a266-197bc50a0414',
//       identity: {
//         cognitoIdentityPoolId: null,
//         accountId: null,
//         cognitoIdentityId: null,
//         caller: null,
//         sourceIp: '130.176.116.74',
//         principalOrgId: null,
//         accessKey: null,
//         cognitoAuthenticationType: null,
//         cognitoAuthenticationProvider: null,
//         userArn: null,
//         userAgent: 'Amazon CloudFront',
//         user: null
//       },
//       domainName: 'a4z0r0cc1c.execute-api.us-east-1.amazonaws.com',
//       apiId: 'a4z0r0cc1c'
//     },
//     body: '------WebKitFormBoundaryRl9TN4rPVuSPUEBm\r\n' +
//       'Content-Disposition: form-data; name="title"\r\n' +
//       '\r\n' +
//       'Apex Legends 2023-05-17 21-41-41.mp4\r\n' +
//       '------WebKitFormBoundaryRl9TN4rPVuSPUEBm\r\n' +
//       'Content-Disposition: form-data; name="uploader"\r\n' +
//       '\r\n' +
//       'd\r\n' +
//       '------WebKitFormBoundaryRl9TN4rPVuSPUEBm\r\n' +
//       'Content-Disposition: form-data; name="description"\r\n' +
//       '\r\n' +
//       '\r\n' +
//       '------WebKitFormBoundaryRl9TN4rPVuSPUEBm\r\n' +
//       'Content-Disposition: form-data; name="id"\r\n' +
//       '\r\n' +
//       'flashy-friction\r\n' +
//       '------WebKitFormBoundaryRl9TN4rPVuSPUEBm\r\n' +
//       'Content-Disposition: form-data; name="duration"\r\n' +
//       '\r\n' +
//       '30.352717\r\n' +
//       '------WebKitFormBoundaryRl9TN4rPVuSPUEBm\r\n' +
//       'Content-Disposition: form-data; name="views"\r\n' +
//       '\r\n' +
//       '0\r\n' +
//       '------WebKitFormBoundaryRl9TN4rPVuSPUEBm\r\n' +
//       'Content-Disposition: form-data; name="comments"\r\n' +
//       '\r\n' +
//       '[]\r\n' +
//       '------WebKitFormBoundaryRl9TN4rPVuSPUEBm--\r\n',
//     isBase64Encoded: false
//   }
  
// const response = handler(event, '', () => null);