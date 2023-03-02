const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "us-east-1", apiVersion: "2006-03-01" });
const CSV = require("csv-string");
const dynamoDBTable = "template";

const dynamodb = new AWS.DynamoDB({ region: "us-east-1" });

exports.handler = async (event, context) => {
  const bucket = "importdatatestbuck";
  const key = "test.csv";
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    const { Body } = await s3.getObject(params).promise();
    // console.log('CONTENT TYPE:', Body.toString());
    // Create a readable stream from the S3 object body buffer
    const csvData = Body.toString();

    const rows = CSV.parse(csvData);

    const headers = rows[0];
    const dataRows = rows.slice(1);

    for (const dataRow of dataRows) {
      const item = {};
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const value = dataRow[i];

        // Skip null, undefined or empty values
        if (value === null || value === undefined || value === "") {
          continue;
        }

        // if (header.includes("content")) {
        //   const value2 = value.map((item) => unmarshall(item));
        //   console.log("Content is:  " + header + " " + value)

        // }
        // Parse the value as JSON if it's an array
        if (value.startsWith("[") && value.endsWith("]")) {
          item[header] = {"L": JSON.parse(value)};
        } else {
          item[header] = {"S": value};
        }
      }

      // Skip the row if it doesn't contain any values
      if (Object.keys(item).length === 0) {
        continue;
      }
      
      

      // Insert the item into DynamoDB
      const putParams = {
        TableName: dynamoDBTable,
        Item: item,
      };
      await dynamodb.putItem(putParams).promise();
    }
  } catch (err) {
    console.log(err);
    const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    console.log(message);
    throw new Error(message);
  }
}