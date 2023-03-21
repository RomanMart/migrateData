const AWS = require("aws-sdk");
const crypto = require("crypto");

const credentials = new AWS.SharedIniFileCredentials({ profile: 'amdocs-learn-prod-eu-west-1' });
AWS.config.credentials = credentials;
AWS.config.update({region: 'eu-west-1'});
const dynamoDBClient = new AWS.DynamoDB.DocumentClient();
const learningItemTableName = "ADD";
const newLearningItemTableName = "ADD";

const mapLearningItem = (input) => {
  const output = {
    PK: "LEARNING-ITEM",
    SK: input.code,
    accountIDs: input.accountIDs || [],
    activated: true,
    code: input.code,
    createdAt: input.creationDate
      ? new Date(input.creationDate).getTime()
      : "",
    createdBy: input.createdBy || "",
    creationDate: input.creationDate || "",
    description: input.description || "",
    domainID: input.domainID || "",
    duration: input.duration || 0,
    durationType: input.durationType || "",
    expectedTime: input.expectedTime || "",
    location: input.location || "",
    productIDs: input.productIDs || [],
    resourceURL: input.resourceURL ? input.resourceURL : input.url ? createHash(input.url) : "",
    roleIDs: input.roleIDs || [],
    specialCaseURL: input.url ? hashSpecialCaseURL(input.url) : "",
    technology: input.technology || "",
    title: input.title || "",
    typeID: input.typeID || "",
    typeName: input.typeName || "",
    updatedAt: input.creationDate || ""
      ? new Date(input.creationDate).getTime()
      : "",
    updatedBy: input.createdBy || "",
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


  (async () => {
    const oldLearningItems = await queryLearningItems();
    // console.log(`Old learningItems: "${JSON.stringify(oldLearningItems)}"`);
    let newLearningItems = [];
  
    oldLearningItems.forEach((learningItem) => {
      console.log(`Start mapping LEARNING ITEM with code "${learningItem.code}"`);
      const mappedLearningItem = mapLearningItem(learningItem);
  
      // console.log(
      //   `Sucessfully mapped LEARNING ITEM. New LEARNING ITEM: "${JSON.stringify(
      //     mappedLearningItem,
      //     null,
      //     "  "
      //   )}"`
      // );
      newLearningItems.push(mappedLearningItem);
    });
  
    await batchWriteItems(newLearningItems);
  
    console.log("Successfully migrated table");
  })();