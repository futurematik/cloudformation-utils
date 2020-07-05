import * as lambda from 'aws-lambda';
import { sendResponse } from './sendResponse';
import { makeResourceName } from './makeResourceName';

export type CreateResourceEvent = lambda.CloudFormationCustomResourceCreateEvent & {
  PhysicalResourceId: string;
};

export type UpdateResourceEvent = lambda.CloudFormationCustomResourceUpdateEvent;
export type DeleteResourceEvent = lambda.CloudFormationCustomResourceDeleteEvent;

export interface ResourceData {
  [key: string]: any;
}

export type ResourceEvent =
  | CreateResourceEvent
  | UpdateResourceEvent
  | DeleteResourceEvent;

export interface ResourceSuccessResponse<Data = ResourceData> {
  PhysicalResourceId?: string;
  Data?: Data;
  NoEcho?: boolean;
  Reason?: string;
  Status: 'SUCCESS';
}

export interface ResourceFailedResponse<Data = ResourceData> {
  PhysicalResourceId?: string;
  Data?: Data;
  NoEcho?: boolean;
  Reason: string;
  Status: 'FAILED';
}

export type ResourceResponse<Data = ResourceData> =
  | ResourceSuccessResponse<Data>
  | ResourceFailedResponse<Data>;

export interface ResourceHandler {
  (event: ResourceEvent, context: lambda.Context): PromiseLike<
    ResourceResponse
  >;
}

export function makeHandler(
  handler: ResourceHandler,
): lambda.CloudFormationCustomResourceHandler {
  return async (sourceEvent, context): Promise<void> => {
    console.log(`custom resource event`, sourceEvent);
    const event = sourceEvent as ResourceEvent;

    if (event.RequestType === 'Create') {
      event.PhysicalResourceId = makeResourceName(
        `${event.StackId}-${event.LogicalResourceId}`,
      );
    }

    let response: ResourceResponse | undefined;

    try {
      response = await handler(event, context);
    } catch (err) {
      console.log(`FAILED`, err);

      response = {
        PhysicalResourceId: event.PhysicalResourceId,
        Status: 'FAILED',
        Reason: err?.message || err?.toString(),
      };
    }

    const fullResponse: lambda.CloudFormationCustomResourceResponse = {
      PhysicalResourceId: event.PhysicalResourceId,
      ...response,
      LogicalResourceId: event.LogicalResourceId,
      RequestId: event.RequestId,
      StackId: event.StackId,
    };

    console.log(`custom resource response`, fullResponse);
    await sendResponse(event.ResponseURL, fullResponse);
  };
}
