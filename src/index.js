import { PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { v4 as uuidv4 } from "uuid";
import { NewTemplate } from "./models/newTemplate";

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

    const newTemplates = oldTemplates.map((template) => {
      let result;
      if (template.SK.includes("#DETAILS")) {
        result = mapDetails(template);
        console.log(result);
      } else if (template.SK.includes("#CONTENT")) {
        result = mapContent(template);

        let metadata = generateMetadata(result);

        ddbClient.send(
            new PutItemCommand({
              TableName: process.env.NEW_TEMPLATES_TABLE_NAME,
              Item: marshall(metadata || {}),
            })
          )

      } else {
        console.log("SK value does not match expected format");
      }
      ddbClient.send(
        new PutItemCommand({
          TableName: process.env.NEW_TEMPLATES_TABLE_NAME,
          Item: marshall(result || {}),
        })
      )
      return result;
      //   return mapToNewTemplate(template);
    });

    console.log(
      `NewTemplates after adding new fields: "${JSON.stringify(
        newTemplates,
        null,
        "  "
      )}"`
    );

    // const putPromises = [];
    // newTemplates.forEach((item) => {
    //   console.log(`Start saving newTemplate: "${{ item }}" into DB`);
    //   putPromises.push(
    //     ddbClient.send(
    //       new PutItemCommand({
    //         TableName: process.env.NEW_TEMPLATES_TABLE_NAME,
    //         Item: marshall(item || {}),
    //       })
    //     )
    //   );
    // });

    // await Promise.all(putPromises);
    console.log("Successfully copied table");
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const mapToNewTemplate = (template) => {
  console.log(`Starting migration of template: "${JSON.stringify(template)}"`);
  let newTemplate = NewTemplate;

  if (template.accountIDs !== undefined) {
    newTemplate.accountIDs = template.accountIDs;
  } else {
    newTemplate.accountIDs = Array.from(new Array(3), (val) => uuidv4); // setting random string array containing UUID values
  }

  if (template.code !== undefined) {
    newTemplate.code = template.code;
  } else {
    newTemplate.code = randomString(); // setting random string
  }

  if (template.customProductIDs !== undefined) {
    newTemplate.customProductIDs = template.customProductIDs;
  } else {
    newTemplate.customProductIDs = randomArray(); // setting random string array containing UUID values
  }

  if (template.description !== undefined) {
    newTemplate.description = template.description;
  } else {
    newTemplate.description = randomString(); // setting random string
  }

  if (template.empSeniorityID !== undefined) {
    newTemplate.empSeniorityID = template.empSeniorityID;
  } else {
    newTemplate.empSeniorityID = uuidv4(); // setting random string
  }

  if (template.expectedTime !== undefined) {
    newTemplate.expectedTime = template.expectedTime;
  } else {
    newTemplate.expectedTime = randomString(); // setting random string
  }
  if (template.itemsCount !== undefined) {
    newTemplate.itemsCount = template.itemsCount;
  } else {
    newTemplate.itemsCount = Math.random(); // setting random string
  }

  if (template.itemsDuration !== undefined) {
    newTemplate.itemsDuration = template.itemsDuration;
  } else {
    newTemplate.itemsDuration = Math.random(); // setting random string
  }

  if (template.location !== undefined) {
    newTemplate.locationIDs[0] = template.location;
  } else {
    newTemplate.itemsDuration = Math.random(); // setting random string
  }

  if (template.org2ID !== undefined) {
    newTemplate.org2ID = template.org2ID;
  } else {
    newTemplate.org2ID = randomString(); // setting random string
  }

  if (template.org3ID !== undefined) {
    newTemplate.org3ID = template.org3ID;
  } else {
    newTemplate.org3ID = randomString(); // setting random string
  }

  if (template.org4ID !== undefined) {
    newTemplate.org4ID = template.org4ID;
  } else {
    newTemplate.org4ID = randomString(); // setting random string
  }

  if (template.org3ID !== undefined) {
    newTemplate.org5ID = template.org5ID;
  } else {
    newTemplate.org5ID = randomString(); // setting random string
  }

  if (template.prerequisites !== undefined) {
    newTemplate.prerequisites = template.prerequisites;
  } else {
    newTemplate.prerequisites = randomString(); // setting random string
  }

  if (template.productIDs !== undefined) {
    newTemplate.productIDs = template.productIDs;
  } else {
    newTemplate.productIDs = randomArray(); // setting random string
  }

  if (template.roleIDs !== undefined) {
    newTemplate.roleIDs = template.roleIDs;
  } else {
    newTemplate.roleIDs = randomArray(); // setting random string
  }

  if (template.title !== undefined) {
    newTemplate.title = template.title;
  } else {
    newTemplate.title = randomString(); // setting random string
  }

  if (template.titleHash !== undefined) {
    newTemplate.titleHash = template.titleHash;
  } else {
    newTemplate.titleHash = uuidv4(); // setting random string
  }

  console.log(`Migrated template: "${newTemplate}"`);
  return newTemplate;
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
