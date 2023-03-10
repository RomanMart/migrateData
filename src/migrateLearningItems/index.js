const AWS = require("aws-sdk");
const { marshall, unmarshall } = AWS.DynamoDB.Converter;
const dynamoDBClient = new AWS.DynamoDB({ region: "us-east-1" });
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const learningItemTableName = "learningItem";
const newLearningItemTableName = "newLearningItem";

exports.handler = async (event, context) => {
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

  const putPromises = [];

  newLearningItems.forEach((item) => {
    console.log(
      `Start saving new Learning Item: "${JSON.stringify(item)}" into DB`
    );
    putPromises.push(
      dynamoDBClient
        .putItem({
          TableName: newLearningItemTableName,
          Item: marshall(item || {}),
        }).promise()
    );
  });

  await Promise.all(putPromises);
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
  try {
    let {Items} = await dynamoDBClient
      .scan({ TableName: learningItemTableName })
      .promise();

    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (e) {
    console.error(e);
    throw e;
  }
  //   let result = null;
  //   let accumulated = [];
  //   let ExclusiveStartKey = null;
  //   do {
  //     result = await dynamoDBClient
  //       .query({
  //         TableName: learningItemTableName,
  //         ExclusiveStartKey,
  //         KeyConditionExpression: "#PK = :PK",
  //         ExpressionAttributeNames: {
  //           "#PK": "PK",
  //         },
  //         ExpressionAttributeValues: {
  //           ":PK": "LEARNING-ITEM",
  //         },
  //       })
  //       .promise();
  //     ExclusiveStartKey = result.LastEvaluatedKey;
  //     accumulated = [...accumulated, ...result.Items];
  //   } while (result.Items.length && result.LastEvaluatedKey);

  //   return accumulated ? accumulated.map((item) => unmarshall(item)) : {};
};
