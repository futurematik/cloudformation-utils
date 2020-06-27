import { makeProgressBar } from 'yaprog';
import prettyBytes from 'pretty-bytes';
import { UploadProgressReporter } from '../deploy/uploadStack';

export interface UploadReporterOptions {
  completeChar?: string;
  format?: string;
  incompleteChar?: string;
  statusFormat?: string;
  width?: number;
}

export function makeUploadReporter(
  opts?: UploadReporterOptions,
): UploadProgressReporter {
  const {
    completeChar = '█',
    format = `uploading :bar :pcurrent/:ptotal bytes (:percent) :etas`,
    incompleteChar = '░',
    statusFormat = `uploading :file (:ptotal)`,
    width = 40,
  } = opts || {};

  const bar = makeProgressBar(format, {
    completeChar,
    incompleteChar,
    total: 0,
    width,
  });

  const files = new Map<string, number>();

  function replaceTokens(
    str: string,
    tokens: Record<string, string | number>,
  ): string {
    for (const token in tokens) {
      str = str.replace(
        new RegExp(`:${token}\\b`, 'g'),
        tokens[token].toString(),
      );
    }
    return str;
  }

  function report(file: string, up: number, total: number) {
    if (!files.has(file)) {
      bar.total += total;
      bar.log(
        replaceTokens(statusFormat, {
          file,
          total,
          ptotal: prettyBytes(total),
        }),
      );
    }
    files.set(file, up);

    const current = [...files.values()].reduce((a, x) => a + x, 0);
    bar.update(current / bar.total, {
      pcurrent: prettyBytes(current),
      ptotal: prettyBytes(bar.total),
    });
  }

  return report;
}
