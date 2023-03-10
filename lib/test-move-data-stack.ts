import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiGatewayConstruct } from "./api-gateway-construct";
import { DynamodbConstruct } from "./dynamodb-construct";
import { LambdaConstruct } from "./lambda-construct";
import { ImportLambdaConstruct } from "./lambda-import-construct";
import { MigrateLearningItemsConstruct } from "./lambda-migrateLearnItem-construct";
import { S3BucketConstruct } from "./s3-bucket-construct";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TestMoveDataStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const database = new DynamodbConstruct(this, "Database");

    const s3 = new S3BucketConstruct(this, "Bucket");

    new ImportLambdaConstruct(this, "ImportLambdaFunction", {
      templatesTable: database.templatesTable,
      s3Bucket: s3.s3Buket
    })

    const lambda = new LambdaConstruct(this, "LambdaFunction", {
      templatesTable: database.templatesTable,
      newTemplatesTable: database.newTemplatesTable
    });

    const learningItems = new MigrateLearningItemsConstruct(this, "LearningItemsFunction", {
      learningItemTable: database.learningItemsTable,
      newlearningItemTable: database.newLearningItemsTable
    })

    new ApiGatewayConstruct(this, "ApiGateway", {
      templatesFunction: lambda.templateFunction,
    });

  }
}
