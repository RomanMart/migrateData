import {Construct} from "constructs";
import {AttributeType, BillingMode, ITable, Table} from "aws-cdk-lib/aws-dynamodb";
import {RemovalPolicy} from "aws-cdk-lib";

export class DynamodbConstruct extends Construct {
    public readonly templatesTable: ITable;
    public readonly newTemplatesTable: ITable;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.templatesTable = this.createTemplatesTable();
        this.newTemplatesTable = this.createNewTemplatesTable();
    }

    private createTemplatesTable(): ITable {
        return new Table(this, "template", {
            partitionKey: {
                name: "PK",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "SK",
                type: AttributeType.STRING
            },
            tableName: "template",
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST
        });
    }

    private createNewTemplatesTable(): ITable {
        return new Table(this, 'newTemplate', {
            partitionKey: {
                name: "PK",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "SK",
                type: AttributeType.STRING
            },
            tableName: 'newTemplate',
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
    }
}