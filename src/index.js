import {
    PutItemCommand,
    ScanCommand
} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {ddbClient} from "./ddbClient";
import {v4 as uuidv4} from 'uuid';

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
                body: body
            })
        };

    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation.",
                errorMsg: e.message,
                errorStack: e.stack,
            })
        };
    }
};

const getAllTemplates = async () => {
    console.log("getAllTemplates");
    try {
        const params = {
            TableName: process.env.TEMPLATES_TABLE_NAME
        };

        const {Items} = await ddbClient.send(new ScanCommand(params));

        console.log(Items);
        return (Items) ? Items.map((item) => unmarshall(item)) : {};

    } catch (e) {
        console.error(e);
        throw e;
    }
}

const getAllNewTemplates = async () => {
    console.log("get new Templates");
    try {
        const params = {
            TableName: process.env.NEW_TEMPLATES_TABLE_NAME
        };

        const {Items} = await ddbClient.send(new ScanCommand(params));

        console.log(Items);
        return (Items) ? Items.map((item) => unmarshall(item)) : {};

    } catch (e) {
        console.error(e);
        throw e;
    }
}

const createTemplate = async (event) => {
    console.log(`createTemplate function. event : "${event}"`);
    try {
        const createTemplateRequest = JSON.parse(event.body);
        createTemplateRequest.id = uuidv4();

        const params = {
            TableName: process.env.TEMPLATES_TABLE_NAME,
            Item: marshall(createTemplateRequest || {})
        };

        const createResult = await ddbClient.send(new PutItemCommand(params));

        console.log(createResult);
        return createResult;

    } catch (e) {
        console.error(e);
        throw e;
    }
}

const migrateToNewTemplates = async (event) => {
    console.log(`migrate function. event : "${event}"`);
    try {

        const newFields = {
            "modelVersion": "v2",
            "templateDescription": "New template description"
        }

        const oldTemplates = await getAllTemplates();

        const newTemplates = oldTemplates.map((template) => {
            return {...template, ...newFields}
        });

        console.log(`NewTemplates after adding new fields: "${newTemplates}"`);

        const putPromises = [];
        newTemplates.forEach((item) => {
            putPromises.push(
              ddbClient.send(
                new PutItemCommand({
                    TableName: process.env.NEW_TEMPLATES_TABLE_NAME,
                    Item: marshall(item || {})
                })
              )
            );
          });
        
          await Promise.all(putPromises);
          console.log("Successfully copied table")
    } catch (e) {
        console.error(e);
        throw e;
    }
}