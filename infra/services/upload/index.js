'use strict';
import { S3 } from '@aws-sdk/client-s3'
import { CloudFormation } from '@aws-sdk/client-cloudformation'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import * as parser from 'aws-lambda-multipart-parser';


export const handler = async (event, context, callback) => {
    console.log('event: ')
    console.log(event)

    if (event.httpMethod === 'PUT') {
        const s3 = new S3();
        const uploadBucket = 'hold-my-clips'

        const parsedData = parser.parse(event);
        console.log(parsedData)

        const id = parsedData['id'];
        
        s3.putObject({
            Bucket: uploadBucket,
            Key: `clips/${id}/${id}.json`, 
            Body: JSON.stringify(parsedData),
            ContentType: 'application/json'},
            function (err,data) {
              console.log(JSON.stringify(err) + ' ' + JSON.stringify(data));
            }
          );
        
          storeIndexRecord(id, parsedData)
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

    const tableName = await getDynamoTableName()
    
    const putParams = {
        TableName: tableName,
        Item: indexItem
    };

    const dynamodb = new DynamoDB();
    dynamodb.putItem(putParams);
}

const getDynamoTableName = () => new Promise((resolve, reject) => {
    const cloudFormation = new CloudFormation();

    cloudFormation.describeStacks({StackName: 'HMCUpload'}, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            reject(err)
        } else {
            const stackOutputs = data.Stacks[0].Outputs
            const tableName = stackOutputs.find(o => o.OutputKey === 'DynamoDbTableName')['OutputValue'];
            resolve(tableName)
        }
    })
})
  