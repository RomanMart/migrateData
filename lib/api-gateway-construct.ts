import {Construct} from "constructs";
import {LambdaRestApi} from "aws-cdk-lib/aws-apigateway";
import {IFunction} from "aws-cdk-lib/aws-lambda";

interface IApiGatewayProps {
    templatesFunction: IFunction,
}

export class ApiGatewayConstruct extends Construct {
    constructor(scope: Construct, id: string, props: IApiGatewayProps) {
        super(scope, id);

        this.createTemplateApi(props.templatesFunction);
    }

    private createTemplateApi(templatesFunction: IFunction) {
        const apigw = new LambdaRestApi(this, 'templateApi', {
            restApiName: 'Templates Service',
            handler: templatesFunction,
            proxy: false
        });

        const templates = apigw.root.addResource('template');
        templates.addMethod('GET');
        templates.addMethod('POST');

        const migrateTemplates = templates.addResource('migrate');
        const migrates3Templates = templates.addResource('migrate-s3');

        migrateTemplates.addMethod('POST');
        migrates3Templates.addMethod('POST')

        const newTemplates = apigw.root.addResource('new-template');
        newTemplates.addMethod('GET');
    }
}