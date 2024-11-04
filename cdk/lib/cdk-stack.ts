import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambda_nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const envname = "cdk-3duploader";

    // データ保管用のS3 Bucketを作成
    const appDataBucket = new s3.Bucket(this, "appDataBucket", {
      bucketName: `${envname}-${this.account}-${this.region}-appdata`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Webサイト用のS3 Bucketを作成
    const siteBucket = new s3.Bucket(this, "staticsitesBucket", {
      bucketName: `${envname}-${this.account}-${this.region}-site`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Webサイト用の静的ファイルをS3にアップロード
    new cdk.aws_s3_deployment.BucketDeployment(
      this,
      `staticSitesBucketUpload-${envname}`,
      {
        sources: [cdk.aws_s3_deployment.Source.asset("../frontend/build")],
        destinationBucket: siteBucket,
      }
    );

    // API用のLambda関数を作成
    const lambdaWebserver = new lambda_nodejs.NodejsFunction(this, "lambda", {
      functionName: `lambda-${envname}`,
      entry: "../backend/src/index.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      bundling: {
        forceDockerBundling: true,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // API用のLambda関数URLを設定
    const functionUrl = lambdaWebserver.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
    });

    // CloudFront ディストリビューションを作成
    const hogeDistribution = new cdk.aws_cloudfront.Distribution(
      this,
      "cloudFrontDistribution",
      {
        comment: `distribution-${envname}`,
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin:
            cdk.aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
              siteBucket
            ),
          cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
        },
        additionalBehaviors: {
          "/api/*": {
            origin: new cdk.aws_cloudfront_origins.FunctionUrlOrigin(
              functionUrl
            ),
            cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
            allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
          },
          "/pointclouds/*": {
            origin:
              cdk.aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
                appDataBucket
              ),
            cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
          },
        },
      }
    );

    // Lambda関数URLのOACを作成（CDKがL2 Constructに対応したら差し替える）
    const cfnLambdaOac = new cdk.aws_cloudfront.CfnOriginAccessControl(
      this,
      "oacLambdaUrl",
      {
        originAccessControlConfig: {
          name: "OacForLambdaUrl",
          originAccessControlOriginType: "lambda",
          signingBehavior: "always",
          signingProtocol: "sigv4",
        },
      }
    );

    // CloudFrontにLambda関数URLのOACを追加
    const cfnDistribution = hogeDistribution.node
      .defaultChild as cdk.aws_cloudfront.CfnDistribution;
    cfnDistribution.addPropertyOverride(
      "DistributionConfig.Origins.1.OriginAccessControlId",
      cfnLambdaOac.attrId
    );

    // LambdaのリソースポリシーにCloudFrontを追加
    lambdaWebserver.addPermission("AllowCloudFrontServicePrincipal", {
      principal: new cdk.aws_iam.ServicePrincipal("cloudfront.amazonaws.com"),
      action: "lambda:InvokeFunctionUrl",
      sourceArn: `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${hogeDistribution.distributionId}`,
    });

    // API用のLambda関数にS3 Bucketの読み取り権限を付与
    appDataBucket.grantRead(lambdaWebserver);
  }
}
