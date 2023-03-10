import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, FunctionProps, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import path = require("path");

interface ILambdaProps {
    learningItemTable: ITable;
    newlearningItemTable: ITable;
}
export class MigrateLearningItemsConstruct extends Construct {
    public readonly importFunction: Function
    constructor(scope: Construct, id: string, props: ILambdaProps) {
        super(scope, id);
        this.importFunction = this.migrateLearningItemsFunction(props.learningItemTable, props.newlearningItemTable);

    }

    private migrateLearningItemsFunction(learningItemsTable: ITable, newLearningItemsTable: ITable): Function {
        const functionProps: FunctionProps = {
            runtime: Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: Code.fromAsset(path.join(__dirname, '/../src/migrateLearningItems')),
        };

        const migrateLearningItemsFunction = new Function(this, 'migrateLearningItemsLambdaFunction', {
            ...functionProps
        });

        learningItemsTable.grantReadWriteData(migrateLearningItemsFunction);
        newLearningItemsTable.grantReadWriteData(migrateLearningItemsFunction);

        return migrateLearningItemsFunction;
    }
}