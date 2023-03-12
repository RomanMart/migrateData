import { PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { v4 as uuidv4 } from "uuid";

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  try {
    let body;
    switch (event.httpMethod) {
      case "GET":
        if (event.path === "/new-template") {
          body = await getAllNewTemplates();
        } else {
          body = await getAllTemplates();
        }
        break;
      case "POST":
        if (event.path === "/template/migrate") {
          body = await migrateToNewTemplates();
        } else {
          body = await createTemplate(event);
        }
        break;
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }

    console.log(body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body: body,
      }),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to perform operation.",
        errorMsg: e.message,
        errorStack: e.stack,
      }),
    };
  }
};

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

const migrateToNewTemplates = async (event) => {
  console.log(`migrate function. event : "${event}"`);
  try {
    const oldTemplates = await getAllTemplates();

    console.log(`Old templates: "${JSON.stringify(oldTemplates)}"`);

    let newTemplates = [];
    oldTemplates.forEach((template) => {
      if (template.SK.includes("#DETAILS")) {
        console.log(`Start mapping DETAILS template with code "${template.code}"`);
        const mappedDetails = mapDetails(template);

        console.log(`Sucessfully mapped DETAILS template. New DETAILS template: "${JSON.stringify(mappedDetails, null, "  ")}"`);
        newTemplates.push(mappedDetails);
      } else if (template.SK.includes("#CONTENT")) {
        console.log(`Start mapping CONTENT template with code "${template.code}"`);
        const mappedContent = mapContent(template);

        console.log(`Sucessfully mapped CONTENT template. New CONTENT template: "${JSON.stringify(mappedContent, null, "  ")}"`);
        newTemplates.push(mappedContent);

        if (mappedContent) {
            console.log(`Start generating metadata object for template with code: "${template.code}}"`);
            const metadata = generateMetadata(mappedContent);
            console.log(`Generated metadata for template with code: "${template.code}}" is: "${JSON.stringify(metadata)}"`);
            newTemplates.push(metadata);
        }
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
  const output = {
    PK: `TEMPLATE#${input.code}`,
    SK: "VERSION#DRAFT#DETAILS",
    accountIDs: input.accountIDs || randomArray(),
    code: input.code || uuidv4(),
    customProductIDs: input.productIDs || randomArray(),
    description: input.description || randomString(),
    empSeniorityID: input.empSeniorityID || randomString(),
    expectedTime: input.expectedTime || randomString(),
    itemsCount: 0,
    itemsDuration: input.itemsDuration || 0,
    locationIDs: input.location ? [input.location] : [],
    org2ID: input.org2ID || randomString(),
    org3ID: input.org3ID || randomString(),
    org4ID: input.org4ID || randomString(),
    org5ID: input.org5ID || randomString(),
    prerequisites: input.prerequisites || "",
    productIDs: input.productIDs || [],
    roleIDs: input.roleIDs || [],
    title: input.title || "",
    titleHash: uuidv4(),
  };

  return output;
};

const mapContent = (input) => {
  const output = {
    PK: `TEMPLATE#${input.code}`,
    SK: "VERSION#DRAFT#CONTENT",
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

  const output = {
    PK: `TEMPLATE#${code}`,
    SK: "VERSION#DRAFT#METADATA",
    code,
    createdAt: Date.now(),
    createdBy: "Roman Martyshchuk",
    createdById: "115763",
    draftWaiting: false,
    isForceUnlocked: false,
    lastEditedBy: "Roman Martyshchuk",
    lastEditedById: "115763",
    recentUpdatedVersion: true,
    status: "draft",
    updatedAt: Date.now(),
  };

  return output;
};

function randomString() {
  return (Math.random() + 1).toString(36);
}

function randomArray() {
  return Array.from(new Array(3), (val) => uuidv4());
}
