import { CloudFormation } from 'aws-sdk';
import { makeEventSource } from './EventSource';
import { assert } from '../util/assert';

const MaxWaitAttempts = 50;
const StackResourceType = 'AWS::CloudFormation::Stack';

export const PendingStatus = 'PENDING';

export interface ChangeSetReporterResource {
  name: string;
  type: string;
  reason?: string;
  stackName: string;
  stackStatus: string;
  status: string;
}

export interface ChangeSetReporter {
  (resource: ChangeSetReporterResource | true): void;
}

export async function executeChangeSet(
  stackName: string,
  changeSetId: string,
  reporter?: ChangeSetReporter,
  cfn = new CloudFormation(),
): Promise<boolean> {
  const changeset = await waitForChangeSetReady(
    stackName,
    changeSetId,
    reporter,
    cfn,
  );
  if (!changeset) {
    return false;
  }

  assert(changeset.Changes && changeset.StackName);
  stackName = changeset.StackName;
  let stackStatus = PendingStatus;
  const startTime = Date.now();

  await cfn
    .executeChangeSet({
      ChangeSetName: changeSetId,
      StackName: stackName,
    })
    .promise();

  if (reporter) {
    const eventSource = makeEventSource(stackName, { cfn, startTime });

    for (const change of changeset.Changes) {
      const conditional = change.ResourceChange?.Replacement === 'Conditional';
      const action = change.ResourceChange?.Action?.toUpperCase();

      let status = PendingStatus;

      if (action) {
        status += '_' + action;
      }
      if (conditional) {
        status += '*';
      }

      reporter({
        name: change.ResourceChange?.LogicalResourceId as string,
        status,
        stackName,
        stackStatus,
        type: change.ResourceChange?.ResourceType as string,
      });
    }

    for await (const event of eventSource.events) {
      reporter({
        name: event.LogicalResourceId as string,
        status: event.ResourceStatus as string,
        stackName,
        stackStatus,
        type: event.ResourceType as string,
        reason: event.ResourceStatusReason,
      });
      if (event.ResourceStatus && event.LogicalResourceId === event.StackName) {
        if (isTerminalStackStatus(event.ResourceStatus)) {
          return true;
        }
        stackStatus = event.ResourceStatus;
      }
    }
  }

  reporter && reporter(true);
  return true;
}

async function waitForChangeSetReady(
  stackId: string,
  changeSetId: string,
  reporter?: ChangeSetReporter,
  cfn = new CloudFormation(),
): Promise<CloudFormation.DescribeChangeSetOutput | undefined> {
  for (let i = 0; ; ++i) {
    const result = await cfn
      .describeChangeSet({
        ChangeSetName: changeSetId,
        StackName: stackId,
      })
      .promise();

    if (reporter) {
      reporter({
        name: result.StackName as string,
        reason: result.StatusReason,
        status: `CHANGESET_${result.Status}`,
        stackName: result.StackName as string,
        stackStatus: `CHANGESET_${result.Status}`,
        type: StackResourceType,
      });
    }

    if (result.Status === 'CREATE_COMPLETE') {
      return result;
    } else if (result.Status === 'FAILED') {
      return;
    } else if (i >= MaxWaitAttempts) {
      if (reporter) {
        reporter({
          name: result.StackName as string,
          reason: 'Timed out waiting for ChangeSet to be ready',
          status: 'FAILED',
          stackName: result.StackName as string,
          stackStatus: PendingStatus,
          type: StackResourceType,
        });
      }
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

function isTerminalStackStatus(status: string): boolean {
  return !status.endsWith('IN_PROGRESS');
}
