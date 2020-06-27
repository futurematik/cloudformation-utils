import chalk from 'chalk';
import {
  ChangeSetReporter,
  ChangeSetReporterResource,
  PendingStatus,
} from '../deploy/executeChangeSet';
import Debug from 'debug';
import throttle from 'lodash.throttle';
import { makeProgressBar } from 'yaprog';

const debug = Debug('ChangeSetReporter');

export interface ChangeSetReporterOptions {
  completeChar?: string;
  incompleteChar?: string;
  slowUpdateSecs?: number;
  width?: number;
}

export function makeChangeSetReporter(
  opts?: ChangeSetReporterOptions,
): ChangeSetReporter {
  const {
    completeChar = '█',
    incompleteChar = '░',
    slowUpdateSecs = 10,
    width = 40,
  } = opts || {};

  const bar = makeProgressBar(
    `:bar applying :current of :total to :stackName (:stackStatus)`,
    {
      completeChar,
      incompleteChar,
      total: 0,
      width,
    },
  );

  const resources = new Map<string, ChangeSetReporterResource>();
  let stackStatus = 'PENDING';
  let rollingBack = false;
  let slow = false;

  const reportSlow = slowUpdateSecs
    ? throttle(
        () => {
          if (slow) {
            return;
          }
          slow = true;
          const color = chalk.gray;

          const waiting = [...resources.values()].filter(
            (event) =>
              event.status.endsWith('IN_PROGRESS') &&
              event.name !== event.stackName,
          );

          if (!waiting.length) {
            return;
          }
          bar.log('');
          bar.log(color(`---- waiting ----`));

          for (const event of waiting) {
            if (
              event.status.endsWith('IN_PROGRESS') &&
              event.name !== event.stackName
            ) {
              bar.log(formatEvent(event, color));
            }
          }

          bar.log(``);
        },
        slowUpdateSecs * 1000,
        { leading: false },
      )
    : () => {};

  return (event: ChangeSetReporterResource | true): void => {
    if (event === true) {
      bar.clear();
      return;
    }
    debug(`report %O`, event);

    slow = false;
    reportSlow();

    resources.set(event.name, event);
    stackStatus = event.stackStatus;

    const nowRollingBack = stackStatus.includes('ROLLBACK');
    if (nowRollingBack && !rollingBack) {
      debug(`rolling back`);
      rollingBack = true;

      bar.total = countEvents(
        resources.values(),
        (status) => !status.startsWith(PendingStatus),
      );
    }

    bar.log(formatEvent(event));
    if (event.reason) {
      bar.log('    ' + chalk.gray(event.reason));
    }

    if (!rollingBack) {
      debug(`bar.total = ${resources.size}`);
      bar.total = resources.size;
    }

    const progress = countEvents(resources.values(), isCompleteStatus);
    debug(`progress ${progress}/${bar.total}`);

    bar.update(progress, {
      stackName: event.stackName,
      stackStatus: statusColor(event.stackStatus)(event.stackStatus),
    });
  };
}

function countEvents(
  events: Iterable<ChangeSetReporterResource>,
  filter: (status: string) => boolean,
): number {
  let count = 0;
  for (const event of events) {
    if (filter(event.status)) {
      ++count;
    }
  }
  return count;
}

function formatEvent(
  event: ChangeSetReporterResource,
  color?: chalk.Chalk,
): string {
  const cstatus = color ? noColor : statusColor(event.status);
  const ctype = color ? noColor : chalk.cyan;

  let message = column(event.name, 40);
  message += ' ';
  message += cstatus(column(event.status, 30));
  message += ' ';
  message += ctype(event.type);

  return color ? color(message) : message;
}

function statusColor(status: string) {
  if (status.includes('ROLLBACK') || status.endsWith('FAILED')) {
    return chalk.redBright;
  }
  if (status.endsWith('COMPLETE')) {
    return chalk.greenBright;
  }
  if (status.endsWith('SKIPPED')) {
    return chalk.gray;
  }
  return chalk.yellowBright;
}

function column(text: string, width: number): string {
  if (text.length > width) {
    return text.slice(0, width - 1) + '…';
  }
  return text.padEnd(width);
}

function isCompleteStatus(status: string): boolean {
  return status.endsWith('COMPLETE');
}

function noColor(x: string): string {
  return x;
}
