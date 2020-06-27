import { CloudFormation } from 'aws-sdk';
import { DescribeStackEventsInput } from 'aws-sdk/clients/cloudformation';
import {
  makeCancellationToken,
  withCancellation,
  OperationCancelledError,
} from '../util/CancellationToken';
import Debug from 'debug';

const debug = Debug('EventSource');

const DefaultPollInterval = 1000;
const DefaultNetDownDelay = 5000;
const ThrottlingRetries = 12;

export interface EventsPollerOptions {
  cfn?: CloudFormation;
  netDownDelay?: number;
  pollInterval?: number;
  startTime?: number;
}

export interface EventSource {
  events: AsyncIterable<CloudFormation.StackEvent>;
  dispose(): void;
}

export function makeEventSource(
  stackId: string,
  options?: EventsPollerOptions,
): EventSource {
  const cfn = options?.cfn || new CloudFormation();
  const startTime = options?.startTime || Date.now();
  const seen = new Set<string>();
  const [cancellation, cancel] = makeCancellationToken();

  async function describeStackEvents(
    input: DescribeStackEventsInput,
  ): Promise<CloudFormation.DescribeStackEventsOutput> {
    for (let attempt = 0; ; ++attempt) {
      try {
        debug(`describeStackEvents %o`, input);
        return await cfn.describeStackEvents(input).promise();
      } catch (err) {
        debug(`describeStackEvents error %O`, err);

        if (err.errno === 'ENETDOWN') {
          attempt = 0;
          await withCancellation(
            new Promise((resolve) =>
              setTimeout(resolve, options?.netDownDelay || DefaultNetDownDelay),
            ),
            cancellation,
          );
        } else if (attempt >= ThrottlingRetries || err.code !== 'Throttling') {
          throw err;
        }
        await withCancellation(
          new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt))),
          cancellation,
        );
      }
    }
  }

  async function getNewEvents(): Promise<CloudFormation.StackEvent[]> {
    const allEvents: CloudFormation.StackEvent[] = [];
    let nextToken: string | undefined;
    debug(`getNewEvents`);

    do {
      const response = await describeStackEvents({
        NextToken: nextToken,
        StackName: stackId,
      });

      nextToken = response.NextToken;
      const events = response.StackEvents || [];

      debug(`events %O`, events);

      const relevant = events.filter(
        (x) => x.Timestamp.getTime() >= startTime && !seen.has(x.EventId),
      );
      if (relevant.length === 0) {
        break;
      }

      allEvents.push(...relevant);

      if (nextToken) {
        // insert a small delay to avoid throttling
        await withCancellation(
          new Promise((resolve) => setTimeout(resolve, 100)),
          cancellation,
        );
      }
    } while (nextToken);

    for (const event of allEvents) {
      seen.add(event.EventId);
    }

    return allEvents.sort(
      (a, b) => a.Timestamp.getTime() - b.Timestamp.getTime(),
    );
  }

  async function* pollEvents(): AsyncIterableIterator<
    CloudFormation.StackEvent
  > {
    debug(`pollEvents`);
    try {
      for (;;) {
        yield* await getNewEvents();

        await withCancellation(
          new Promise((resolve) =>
            setTimeout(resolve, options?.pollInterval || DefaultPollInterval),
          ),
          cancellation,
        );
      }
    } catch (err) {
      debug(`pollEvents error %O`, err);
      if (!OperationCancelledError.is(err)) {
        throw err;
      }
    }
  }

  return {
    events: pollEvents(),
    dispose: cancel,
  };
}
