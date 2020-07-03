import { makeProgressBar, ProgressBarTokens } from 'yaprog';
import prettyBytes from 'pretty-bytes';
import { UploadProgressReporter, UploadProgress } from '../deploy/uploadStack';

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
    format = `uploading :bar :pcurrent/:ptotal bytes (:percent)`,
    incompleteChar = '░',
    statusFormat = `uploading :file (:pfiletotal)`,
    width = 40,
  } = opts || {};

  const bar = makeProgressBar(format, {
    completeChar,
    incompleteChar,
    tokens: {
      pcurrent: (tokens: ProgressBarTokens) => prettyBytes(tokens.current),
      ptotal: (tokens: ProgressBarTokens) => prettyBytes(tokens.total),
    },
    total: 0,
    width,
  });

  const files = new Map<string, number>();

  function report(progress: UploadProgress) {
    if (progress.done) {
      bar.clear();
      return;
    }
    const { bytesUp, file, total } = progress;

    if (!files.has(file)) {
      bar.total += total;
      bar.log(statusFormat, {
        file,
        filetotal: total,
        pfiletotal: prettyBytes(total),
      });
    }
    files.set(file, bytesUp);

    const current = [...files.values()].reduce((a, x) => a + x, 0);
    bar.update(current);
  }

  return report;
}
