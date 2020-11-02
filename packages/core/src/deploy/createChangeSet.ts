import { CloudFormation } from 'aws-sdk';
import { downloadManifest } from './downloadManifest';
import {
  ChangeSetParameterMap,
  convertParameters,
} from './ChangeSetParameterMap';
import { getStackInfo } from './getStackInfo';

export interface ChangeSetParameterFactory {
  (existing: CloudFormation.Stack | undefined): ChangeSetParameterMap;
}

export interface CreateChangeSetOptions {
  stackName: string;
  version: string;
  bucketName: string;
  manifestKey: string;
  parameters?: ChangeSetParameterMap | ChangeSetParameterFactory;
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

  const cfn = new CloudFormation({ region: options.region });
  const existing = await getStackInfo(options.stackName, cfn);

  const params = options.parameters
    ? convertParameters(
        typeof options.parameters === 'function'
          ? options.parameters(existing)
          : options.parameters,
      )
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

  return await cfn
    .createChangeSet({
      Capabilities: ['CAPABILITY_NAMED_IAM'],
      ChangeSetName: `${options.stackName}-${options.version}-${Date.now()}`,
      ChangeSetType: existing ? 'UPDATE' : 'CREATE',
      Parameters: params,
      StackName: options.stackName,
      TemplateURL: `https://${options.bucketName}.s3.amazonaws.com/${manifest.template}`,
    })
    .promise();
}
