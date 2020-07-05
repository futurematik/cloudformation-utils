import Lambda from 'aws-sdk/clients/lambda';
import {
  makeHandler,
  ResourceResponse,
  ResourceSuccessResponse,
  CreateResourceEvent,
  UpdateResourceEvent,
  DeleteResourceEvent,
} from '@cfnutil/runtime';
import { processZipFile } from './processZipFile';

export interface RegionalFunctionProps extends Lambda.CreateFunctionRequest {
  Region: string;
}

export interface RegionalFunctionAttributes {
  Arn: string;
  Version: string;
  VersionArn: string;
}

export const handler = makeHandler(
  async (event): Promise<ResourceResponse<RegionalFunctionAttributes>> => {
    switch (event.RequestType) {
      case 'Create':
        return await runCreate(event);

      case 'Update':
        return await runUpdate(event);

      case 'Delete':
        return await runDelete(event);
    }

    return {
      Status: 'SUCCESS',
    };
  },
);

async function runCreate(
  event: CreateResourceEvent | UpdateResourceEvent,
): Promise<ResourceSuccessResponse<RegionalFunctionAttributes>> {
  const { Region, ServiceToken, ...rest } = event.ResourceProperties;
  const props = await processCode(rest as Lambda.CreateFunctionRequest);
  const lambda = new Lambda({ region: Region });

  const response = await lambda
    .createFunction({
      Publish: true,
      ...props,
    })
    .promise();

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: response.FunctionName as string,
    Data: {
      Arn: response.FunctionArn as string,
      Version: response.Version as string,
      VersionArn: `${response.FunctionArn}:${response.Version}`,
    },
  };
}

async function runUpdate(
  event: UpdateResourceEvent,
): Promise<ResourceSuccessResponse<RegionalFunctionAttributes>> {
  const { Region: oldRegion, ...oldRest } = event.OldResourceProperties;
  const {
    Region: newRegion,
    ServiceToken,
    ...newRest
  } = event.ResourceProperties;

  const oldProps = oldRest as Lambda.CreateFunctionRequest;
  const newProps = newRest as Lambda.CreateFunctionRequest;

  const differentName =
    (!!newProps.FunctionName || !!oldProps.FunctionName) &&
    newProps.FunctionName !== oldProps.FunctionName;

  if (newRegion !== oldRegion || differentName) {
    await runDelete(event);
    return await runCreate(event);
  }

  const lambda = new Lambda({
    region: newRegion,
  });

  const { Code, ...configProps } = await processCode(newProps);

  const updateCode =
    Code.S3Bucket !== oldProps.Code.S3Bucket ||
    Code.S3Key !== oldProps.Code.S3Key ||
    Code.S3ObjectVersion !== oldProps.Code.S3ObjectVersion ||
    Code.ZipFile !== oldProps.Code.ZipFile;

  if (updateCode) {
    await lambda
      .updateFunctionCode({
        FunctionName: event.PhysicalResourceId,
        ...Code,
      })
      .promise();
  }

  const updateResponse = await lambda
    .updateFunctionConfiguration({
      ...configProps,
      FunctionName: event.PhysicalResourceId,
    })
    .promise();

  const publishResponse = await lambda
    .publishVersion({
      FunctionName: event.PhysicalResourceId,
    })
    .promise();

  return {
    Status: 'SUCCESS',
    Data: {
      Arn: updateResponse.FunctionArn as string,
      Version: publishResponse.Version as string,
      VersionArn: publishResponse.FunctionArn as string,
    },
  };
}

async function runDelete(
  event: DeleteResourceEvent | UpdateResourceEvent,
): Promise<ResourceSuccessResponse<RegionalFunctionAttributes>> {
  const lambda = new Lambda({ region: event.ResourceProperties.Region });

  try {
    await lambda
      .deleteFunction({ FunctionName: event.PhysicalResourceId })
      .promise();
  } catch (err) {
    if (err.code !== 'ResourceNotFoundException') {
      throw err;
    }
  }

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: event.PhysicalResourceId,
  };
}

async function processCode(
  props: Lambda.CreateFunctionRequest,
): Promise<Lambda.CreateFunctionRequest> {
  if (typeof props.Code.ZipFile !== 'string') {
    return props;
  }
  return {
    ...props,
    Code: {
      ...props.Code,
      ZipFile: await processZipFile(props.Code.ZipFile),
    },
  };
}
