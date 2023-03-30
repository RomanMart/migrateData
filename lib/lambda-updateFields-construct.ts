import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, FunctionProps, Runtime } from "aws-cdk-lib/aws-lambda";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import path = require("path");

interface ILambdaProps {
    learningItemTable: ITable;
    newTemplatesTable: ITable;
    s3Bucket: IBucket
}
export class UpdateFieldsItemsConstruct extends Construct {
    public readonly importFunction: Function
    constructor(scope: Construct, id: string, props: ILambdaProps) {
        super(scope, id);
        this.importFunction = this.updateFieldsFunction(props.learningItemTable, props.newTemplatesTable, props.s3Bucket);

    }

    private updateFieldsFunction(learningItemsTable: ITable, newTemplatesTable: ITable, s3Bucket: IBucket): Function {
        const functionProps: FunctionProps = {
            runtime: Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: Code.fromAsset(path.join(__dirname, '/../src/updateFields')),
        };

        const updateFieldsFunction = new Function(this, 'updateFieldsLambdaFunction', {
            ...functionProps
        });

        learningItemsTable.grantReadWriteData(updateFieldsFunction);
        newTemplatesTable.grantReadWriteData(updateFieldsFunction);

        s3Bucket.grantPut(updateFieldsFunction);
        s3Bucket.grantReadWrite(updateFieldsFunction);
        s3Bucket.grantDelete(updateFieldsFunction);
        
        return updateFieldsFunction;
    }
}