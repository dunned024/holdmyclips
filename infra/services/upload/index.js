'use strict';
import { CloudFormation } from '@aws-sdk/client-cloudformation'
import { CloudFront } from '@aws-sdk/client-cloudfront'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { S3 } from '@aws-sdk/client-s3'
import * as parser from 'aws-lambda-multipart-parser';


export const handler = async (event, context, callback) => {
    console.log({event})
    console.log({stringEvent: JSON.stringify(event)})

    if (event.httpMethod === 'PUT') {
        const parsedData = JSON.parse(event.body);
        console.log({parsedData})

        const id = parsedData['id'];
        
        const s3 = new S3();
        s3.putObject({
            Bucket: 'hold-my-clips',
            Key: `clips/${id}/${id}.json`, 
            Body: JSON.stringify(parsedData),
            ContentType: 'application/json'},
            function (err,data) {
                if (err) {
                    console.log({error: 'Error in S3 upload:' + JSON.stringify(err) + ' ' + JSON.stringify(data)});
                }
                return data;
            }
          );
        
        await storeIndexRecord(id, parsedData);
        await invalidateDistributionPath();
    }
    
    callback(null, event);
}

const storeIndexRecord = async (id, parsedData) => {
    const indexItem = {};

    const sanitizedTitle = parsedData['title'].replace(/"/g, '\\"')
    const sanitizedDescription = (parsedData['description'] || '').replace(/"/g, '\\"')
    console.log({parsedTitle: parsedData['title'], sanitizedTitle})

    indexItem['id'] = {S: id};
    indexItem['title'] = {S: sanitizedTitle};
    indexItem['uploader'] = {S: parsedData['uploader']};
    indexItem['description'] = {S: sanitizedDescription};
    indexItem['duration'] = {N: parsedData['duration']};

    const tableName = await _getStackOutput('HMCClipdex', 'ClipdexTableName')
    console.log({tableName})
    
    const putParams = {
        TableName: tableName,
        Item: indexItem
    };
    console.log({putParams})

    const dynamodb = new DynamoDB();
    dynamodb.putItem(putParams);
}

const invalidateDistributionPath = async () => {
    const distributionId = await _getStackOutput('HMCStaticSite', 'StaticSiteDistributionId');
    console.log({distributionId})

    const callerReference = new Date().toISOString().replace(/\:|\-|\./g, '')
    console.log({callerReference})

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
        if (err) console.log({err, errStack: err.stack});
        else console.log(data)
    })
}

const _getStackOutput = (stackName, outputKey) => new Promise((resolve, reject) => {
    const cloudFormation = new CloudFormation();

    cloudFormation.describeStacks({StackName: stackName}, function(err, data) {
        if (err) {
            console.log({err, errStack: err.stack});
            reject(err)
        } else {
            const stackOutputs = data.Stacks[0].Outputs
            const output = stackOutputs.find(o => o.OutputKey === outputKey)['OutputValue'];
            resolve(output)
        }
    })
})
