import { CloudFormation } from 'aws-sdk';
import { downloadManifest } from './downloadManifest';
import { stackExists } from './stackExists';
import {
  ChangeSetParameterMap,
  convertParameters,
} from './ChangeSetParameterMap';

export interface CreateChangeSetOptions {
  stackName: string;
  version: string;
  bucketName: string;
  manifestKey: string;
  parameters?: ChangeSetParameterMap;
  region?: string;
}

export async function createChangeSet(
  options: CreateChangeSetOptions,
): Promise<CloudFormation.CreateChangeSetOutput> {
  const manifest = await downloadManifest(
    options.bucketName,
    options.manifestKey,
    options.region,
  );

  const params = options.parameters
    ? convertParameters(options.parameters)
    : [];

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

  const cfn = new CloudFormation({ region: options.region });

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
