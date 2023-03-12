const AWS = require("aws-sdk");
const dynamoDBClient = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const learningItemTableName = "learningItem";
const newLearningItemTableName = "newLearningItem";

exports.handler = async () => {
  const oldLearningItems = await queryLearningItems();
  console.log(`Old learningItems: "${JSON.stringify(oldLearningItems)}"`);
  let newLearningItems = [];

  oldLearningItems.forEach((learningItem) => {
    console.log(`Start mapping LEARNING ITEM with code "${learningItem.code}"`);
    const mappedLearningItem = mapLearningItem(learningItem);

    console.log(
      `Sucessfully mapped LEARNING ITEM. New LEARNING ITEM: "${JSON.stringify(
        mappedLearningItem,
        null,
        "  "
      )}"`
    );
    newLearningItems.push(mappedLearningItem);
  });

  await batchWriteItems(newLearningItems);

  console.log("Successfully migrated table");
};

const mapLearningItem = (input) => {
  const output = {
    PK: "LEARNING-ITEM",
    SK: input.code,
    accountIDs: input.accountIDs,
    activated: false,
    code: input.code || uuidv4(),
    createdAt: input.creationDate
      ? new Date(input.creationDate).getTime()
      : Date.now(),
    createdBy: input.createdBy,
    creationDate: input.creationDate,
    description: input.description,
    domainID: input.domainID,
    duration: input.duration || 0,
    durationType: input.durationType,
    expectedTime: input.expectedTime,
    location: input.location || "",
    productIDs: input.productIDs,
    resourceURL: input.resourceURL ? input.resourceURL : createHash(input.url),
    roleIDs: input.roleIDs || [],
    specialCaseURL: hashSpecialCaseURL(input.url),
    technology: input.technology || "",
    title: input.title || "",
    typeID: input.typeID || "",
    typeName: input.typeName || "",
    updatedAt: input.creationDate
      ? new Date(input.creationDate).getTime()
      : Date.now(),
    updatedBy: input.createdBy,
    url: input.url || "",
  };

  return output;
};

const createHash = (value) =>
  crypto.createHash("md5").update(value).digest("hex");

const hashSpecialCaseURL = (url) => {
  const specialCaseURL = url ? url.split("?")[0] : "";
  return specialCaseURL ? createHash(specialCaseURL) : createHash("Empty");
};

const queryLearningItems = async () => {
  let result = null;
  let accumulated = [];
  let ExclusiveStartKey = null;
  do {
    result = await dynamoDBClient
      .query({
        TableName: learningItemTableName,
        ExclusiveStartKey,
        KeyConditionExpression: "#PK = :PK",
        ExpressionAttributeNames: {
          "#PK": "PK",
        },
        ExpressionAttributeValues: {
          ":PK": "LEARNING-ITEM",
        },
      })
      .promise();
    ExclusiveStartKey = result.LastEvaluatedKey;
    accumulated = [...accumulated, ...result.Items];
  } while (result.Items.length && result.LastEvaluatedKey);

  return accumulated;
};

const batchWriteItems = async (items) => {
  if (items && items.length) {
    const batchCalls = chunks(items, 25).map(async (chunk) => {
      const putRequests = chunk.map((item) => ({
        PutRequest: {
          Item: item,
        },
      }));
      const batchWriteParams = {
        RequestItems: {
          [newLearningItemTableName]: putRequests,
        },
      };

      await sleep(1000);
      const result = await dynamoDBClient
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
          const resultUnprocessedItems = await dynamoDBClient
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
