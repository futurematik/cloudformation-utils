import * as lambda from 'aws-lambda';
import { hash } from './hash';
import { sendResponse } from './sendResponse';

export type ResourceEvent =
  | (lambda.CloudFormationCustomResourceCreateEvent & {
      PhysicalResourceId: string;
    })
  | lambda.CloudFormationCustomResourceUpdateEvent
  | lambda.CloudFormationCustomResourceDeleteEvent;

export type ResourceResponse = {
  PhysicalResourceId?: string;
  Data?: {
    [Key: string]: any;
  };
  NoEcho?: boolean;
} & (
  | {
      Status: 'FAILED';
      Reason: string;
    }
  | {
      Status: 'SUCCESS';
      Reason?: string;
    }
);

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
      event.PhysicalResourceId = hash([event.StackId, event.LogicalResourceId]);
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
