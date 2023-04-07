import {Construct} from "constructs";
import {NodejsFunction, NodejsFunctionProps} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {ITable} from "aws-cdk-lib/aws-dynamodb";
import { IBucket } from "aws-cdk-lib/aws-s3";

interface IMicroserviceProps {
    templatesTable: ITable;
    newTemplatesTable: ITable;
}

export class LambdaConstruct extends Construct {

    public readonly templateFunction: NodejsFunction;
    // public readonly importFunction: NodejsFunction;

    constructor(scope: Construct, id: string, props: IMicroserviceProps) {
        super(scope, id);

        this.templateFunction = this.createTemplateFunction(props.templatesTable, props.newTemplatesTable);
        // this.importFunction = this.createImportFunction(props.templatesTable, props.s3Bucket);

    }

    private createTemplateFunction(templatesTable: ITable, newTemplatesTable: ITable): NodejsFunction {
        const nodeJsFunctionProps: NodejsFunctionProps = {
            bundling: {
                externalModules: [
                    'aws-sdk'
                ]
            },
            environment: {
                PRIMARY_KEY: 'id',
                TEMPLATES_TABLE_NAME: templatesTable.tableName,
                NEW_TEMPLATES_TABLE_NAME: newTemplatesTable.tableName,
            },
            runtime: Runtime.NODEJS_18_X
        };

        const templatesFunction = new NodejsFunction(this, 'templateLambdaFunction', {
            entry: join(__dirname, `/../src/handler.js`),
            ...nodeJsFunctionProps
        });

        templatesTable.grantReadWriteData(templatesFunction);
        newTemplatesTable.grantReadWriteData(templatesFunction);

        return templatesFunction;
    }
    // private createImportFunction(templatesTable: ITable, s3Bucket: IBucket): NodejsFunction {
    //     const nodeJsFunctionProps: NodejsFunctionProps = {
    //         bundling: {
    //             externalModules: [
    //                 'aws-sdk',
    //                 'csv-parser'
    //                             ]
    //         },
    //         environment: {
    //             PRIMARY_KEY: 'id',
    //             TEMPLATES_TABLE_NAME: templatesTable.tableName,
    //         },
    //         runtime: Runtime.NODEJS_18_X
    //     };

    //     const importFunction = new NodejsFunction(this, 'importLambdaFunction', {
    //         entry: join(__dirname, `/../src/importData/index.js`),
    //         ...nodeJsFunctionProps
    //     });

    //     templatesTable.grantReadWriteData(importFunction);
    //     s3Bucket.grantPut(importFunction);
    //     s3Bucket.grantReadWrite(importFunction);
    //     s3Bucket.grantDelete(importFunction);

    //     return importFunction;
    // }
}