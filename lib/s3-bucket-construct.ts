import { RemovalPolicy } from "aws-cdk-lib";
import { Bucket, BucketAccessControl, IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3BucketConstruct extends Construct {

    public readonly s3Buket: IBucket
    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.s3Buket = new Bucket(this, 'Bucket', {
            autoDeleteObjects: true,
            bucketName: 'importdatatestbuck',
            removalPolicy: RemovalPolicy.DESTROY,
            publicReadAccess: true,
            accessControl: BucketAccessControl.PUBLIC_READ_WRITE
          });
    }

}