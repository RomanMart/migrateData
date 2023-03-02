import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, FunctionProps, Runtime } from "aws-cdk-lib/aws-lambda";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import path = require("path");

interface ILambdaProps {
    templatesTable: ITable;
    s3Bucket: IBucket
}
export class ImportLambdaConstruct extends Construct {
    public readonly importFunction: Function
    constructor(scope: Construct, id: string, props: ILambdaProps) {
        super(scope, id);
        this.importFunction = this.createImportFunction(props.templatesTable, props.s3Bucket);

    }

    private createImportFunction(templatesTable: ITable, s3Bucket: IBucket): Function {
        const functionProps: FunctionProps = {
            runtime: Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: Code.fromAsset(path.join(__dirname, '/../src/importData')),
        };

        const importFunction = new Function(this, 'importLambdaFunction', {
            ...functionProps
        });

        templatesTable.grantReadWriteData(importFunction);
        s3Bucket.grantPut(importFunction);
        s3Bucket.grantReadWrite(importFunction);
        s3Bucket.grantDelete(importFunction);

        return importFunction;
    }
}