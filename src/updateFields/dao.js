const AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient();
const LI_TABLE_NAME = "newLearningItem";
const TEMPLATE_TABLE_NAME = "newTemplate";

const getTemplates = async (key) => {
  return await documentClient
    .scan({
      TableName: TEMPLATE_TABLE_NAME,
      ExclusiveStartKey: key,
      FilterExpression: "SK = :SK",
      ExpressionAttributeValues: {
        ":SK": "VERSION#V0#METADATA",
      },
      Limit: 25,
    })
    .promise();
};
const getLearningItems = async (key) => {
  return await documentClient
    .query({
      TableName: LI_TABLE_NAME,
      ExclusiveStartKey: key,
      KeyConditionExpression: "#PK = :PK",
      ExpressionAttributeNames: {
        "#PK": "PK",
      },
      ExpressionAttributeValues: {
        ":PK": "LEARNING-ITEM",
      },
      Limit: 25,
    })
    .promise();
};

const getTemplatesByCode = async (code) => {
  return await documentClient
    .query({
      TableName: TEMPLATE_TABLE_NAME,
      KeyConditionExpression: "#PK = :PK",
      ExpressionAttributeNames: {
        "#PK": "PK",
      },
      ExpressionAttributeValues: {
        ":PK": `TEMPLATE#${code}`,
      },
    })
    .promise();
};

const batchWriteTemplates = async (items) => {
  await batchWriteItems(items, TEMPLATE_TABLE_NAME);
};
const batchWriteLearningItems = async (items) => {
  await batchWriteItems(items, LI_TABLE_NAME);
};

const batchWriteItems = async (items, table) => {
  if (items && items.length) {
    const batchCalls = chunks(items, 25).map(async (chunk) => {
      const putRequests = chunk.map((item) => ({
        PutRequest: {
          Item: item,
        },
      }));
      const batchWriteParams = {
        RequestItems: {
          [table]: putRequests,
        },
      };

      await sleep(1000);
      const result = await documentClient
        .batchWrite(batchWriteParams)
        .promise();

      if (
        result.UnprocessedItems &&
        Object.keys(result.UnprocessedItems).length
      ) {
        let resultUnprocessed = null;
        for (let i = 0; i < 10; i++) {
          await sleep(1000);
          const batchWriteUnprocessed = {
            RequestItems: result.UnprocessedItems,
          };
          const resultUnprocessedItems = await documentClient
            .batchWrite(batchWriteUnprocessed)
            .promise();

          if (
            resultUnprocessedItems.UnprocessedItems &&
            Object.keys(resultUnprocessedItems.UnprocessedItems).length
          ) {
            continue;
          } else {
            resultUnprocessed = resultUnprocessedItems;
            break;
          }
        }
        return resultUnprocessed;
      }
      return result;
    });

    await Promise.all(batchCalls);
  }
};

const chunks = (items, batchSize) => {
  const batchItems = [];
  const iterations = Math.ceil(items.length / batchSize);

  for (let index = 0; index < iterations; index++) {
    batchItems.push(items.slice(index * batchSize, (index + 1) * batchSize));
  }

  return batchItems;
};

const sleep = async (msec) =>
  new Promise((resolve) => setTimeout(resolve, msec));

module.exports = {
  getLearningItems,
  getTemplates,
  batchWriteTemplates,
  batchWriteLearningItems,
  getTemplatesByCode,
};
