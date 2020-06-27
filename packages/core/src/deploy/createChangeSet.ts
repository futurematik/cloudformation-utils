import { CloudFormation } from 'aws-sdk';
import { downloadManifest } from './downloadManifest';
import { stackExists } from './stackExists';

export interface ChangeSetOptions {
  stackName: string;
  version: string;
  bucketName: string;
  manifestKey: string;
  parameters?: Record<string, string>;
}

export async function createChangeSet(
  options: ChangeSetOptions,
): Promise<CloudFormation.CreateChangeSetOutput> {
  const manifest = await downloadManifest(
    options.bucketName,
    options.manifestKey,
  );
  const params: CloudFormation.Parameter[] = [];

  if (options.parameters) {
    for (const key in options.parameters) {
      params.push({
        ParameterKey: key,
        ParameterValue: options.parameters[key],
      });
    }
  }

  for (const [asset, parameter] of Object.entries(manifest.parameters)) {
    params.push({
      ParameterKey: parameter.bucket,
      ParameterValue: options.bucketName,
    });
    params.push({
      ParameterKey: parameter.object,
      ParameterValue: manifest.assets[asset],
    });
  }

  const cfn = new CloudFormation();

  return await cfn
    .createChangeSet({
      Capabilities: ['CAPABILITY_NAMED_IAM'],
      ChangeSetName: `${options.stackName}-${options.version}-${Date.now()}`,
      ChangeSetType: (await stackExists(options.stackName, cfn))
        ? 'UPDATE'
        : 'CREATE',
      Parameters: params,
      StackName: options.stackName,
      TemplateURL: `https://${options.bucketName}.s3.amazonaws.com/${manifest.template}`,
    })
    .promise();
}
