// import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
const {DynamoDBClient} = require("@aws-sdk/client-dynamodb");

const REGION = "eu-west-1"; 
const ddbClient = new DynamoDBClient({region: REGION, profile: "amdocs-learn-prod-eu-west-1"});

module.exports = {ddbClient};
