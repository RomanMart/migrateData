import {Construct} from "constructs";
import {AttributeType, BillingMode, ITable, Table} from "aws-cdk-lib/aws-dynamodb";
import {RemovalPolicy} from "aws-cdk-lib";

export class DynamodbConstruct extends Construct {
    public readonly templatesTable: ITable;
    public readonly newTemplatesTable: ITable;
    public readonly learningItemsTable: ITable;
    public readonly newLearningItemsTable: ITable;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.templatesTable = this.createTemplatesTable();
        this.newTemplatesTable = this.createNewTemplatesTable();
        this.learningItemsTable = this.createLearningItemsTable();
        this.newLearningItemsTable = this.createNewLearningItemsTable();
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
    private createLearningItemsTable(): ITable {
        return new Table(this, 'learningItem', {
            partitionKey: {
                name: "PK",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "SK",
                type: AttributeType.STRING
            },
            tableName: 'learningItem',
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
    }
    private createNewLearningItemsTable(): ITable {
        return new Table(this, 'newLearningItem', {
            partitionKey: {
                name: "PK",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "SK",
                type: AttributeType.STRING
            },
            tableName: 'newLearningItem',
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
    }
}