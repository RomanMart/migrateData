const { PutItemCommand, ScanCommand } =require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { ddbClient } = require("./ddbClient");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

process.env.ITEMS_TABLE_NAME = ""
process.env.TEMPLATES_TABLE_NAME = "ADD";
process.env.NEW_TEMPLATES_TABLE_NAME = "ADD";

const createHash = (value) => (
  crypto.createHash('md5').update(value).digest('hex')
);

const getAllTemplates = async () => {
  console.log("getAllTemplates");
  try {
    const params = {
      TableName: process.env.TEMPLATES_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));

    console.log(Items);
    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getAllNewTemplates = async () => {
  console.log("get new Templates");
  try {
    const params = {
      TableName: process.env.NEW_TEMPLATES_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));

    console.log(Items);
    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const createTemplate = async (event) => {
  console.log(`createTemplate function. event : "${event}"`);
  try {
    const createTemplateRequest = JSON.parse(event.body);
    // createTemplateRequest.id = uuidv4();

    const params = {
      TableName: process.env.TEMPLATES_TABLE_NAME,
      Item: marshall(createTemplateRequest || {}),
    };

    const createResult = await ddbClient.send(new PutItemCommand(params));

    console.log(createResult);
    return createResult;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const migrateToNewTemplates = async () => {
  console.log(`migrate function. event`);
  try {
    const oldTemplates = await getAllTemplates();

    // console.log(`Old templates: "${JSON.stringify(oldTemplates)}"`);

    let newTemplates = [];
    oldTemplates.forEach((template) => {
      if (template.SK.includes("#DETAILS")) {
        console.log(`Start mapping DETAILS template with code "${template.code}"`);
        const mappedDetails = mapDetails(template);

        console.log(`Sucessfully mapped DETAILS template. New DETAILS template: "${JSON.stringify(mappedDetails, null, "  ")}"`);
        newTemplates.push(mappedDetails);
        if (mappedDetails) {
          console.log(`Start generating metadata object for template with code: "${template.code}}"`);
          const metadata = generateMetadata(mappedDetails);
          console.log(`Generated metadata for template with code: "${template.code}}" is: "${JSON.stringify(metadata)}"`);
          newTemplates.push(metadata);
      }
      } else if (template.SK.includes("#CONTENT")) {
        console.log(`Start mapping CONTENT template with code "${template.code}"`);
        const mappedContent = mapContent(template);

        console.log(`Sucessfully mapped CONTENT template. New CONTENT template: "${JSON.stringify(mappedContent, null, "  ")}"`);
        newTemplates.push(mappedContent);
      } else {
        console.log("SK value does not match expected format");
      }
    });

    console.log(
      `NewTemplates after adding new fields: "${JSON.stringify(
        newTemplates,
        null,
        "  "
      )}"`
    );

    const putPromises = [];
    newTemplates.forEach((item) => {
      console.log(`Start saving newTemplate: "${JSON.stringify(item)}" into DB`);
      putPromises.push(
        ddbClient.send(
          new PutItemCommand({
            TableName: process.env.NEW_TEMPLATES_TABLE_NAME,
            Item: marshall(item || {}),
          })
        )
      );
    });

    await Promise.all(putPromises);
    console.log("Successfully migrated table");
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const mapDetails = (input) => {
  const dateNow = new Date().getTime();
  const updatedAt = input.updatedAt ? marshall(Number(input.updatedAt)) : marshall(dateNow);
  const output = {
    PK: `TEMPLATE#${input.code}`,
    SK: "VERSION#V0#DETAILS",
    accountIDs: input.accountIDs || [],
    code: input.code || "",
    customProductIDs: input.productIDs || [],
    description: input.description || "",
    empSeniorityID: input.empSeniorityID || "",
    expectedTime: input.expectedTime || "",
    itemsCount: 0,
    itemsDuration: input.itemsDuration || 0,
    locationIDs: input.location ? [input.location] : [],
    org2ID: input.org2ID || "",
    org3ID: input.org3ID || "",
    org4ID: input.org4ID || "",
    org5ID: input.org5ID || "",
    prerequisites: input.prerequisites || "",
    productIDs: input.productIDs || [],
    roleIDs: input.roleIDs || [],
    title: input.title || "",
    titleHash: input.title ? createHash(input.title) : "",
    updatedAt
  };

  return output;
};

const mapContent = (input) => {
  const output = {
    PK: `TEMPLATE#${input.code}`,
    SK: "VERSION#V0#CONTENT",
    code: input.code,
    content: input.content.map((part) => {
      return {
        name: part.name,
        order: part.order,
        items: part.items.map((item) => {
          return {
            code: item.code,
            order: item.order,
          };
        }),
      };
    }),
  };

  return output;
};

const generateMetadata = (result) => {
  const code = result.code;
  const updatedAt = result.updatedAt;
  const output = {
    PK: `TEMPLATE#${code}`,
    SK: "VERSION#V0#METADATA",
    code,
    createdAt: updatedAt,
    createdBy: "",
    createdById: "",
    draftWaiting: false,
    isForceUnlocked: false,
    lastEditedBy: "",
    lastEditedById: "",
    recentUpdatedVersion: true,
    status: "published",
    updatedAt
  };

  return output;
};

(async () => await migrateToNewTemplates())();