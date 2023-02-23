import { RemovalPolicy } from "aws-cdk-lib";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3BucketConstruct extends Construct {

    public readonly s3Buket: IBucket
    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.s3Buket = new Bucket(this, 'BackupBucket', {
            autoDeleteObjects: true,
            bucketName: 'dbbackup',
            removalPolicy: RemovalPolicy.DESTROY,
          });
    }

}