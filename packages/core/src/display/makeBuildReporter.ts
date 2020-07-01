import {
  BuildStackReporter,
  BuildStackReporterItem,
} from '../deploy/buildStack';
import { makeProgressBar } from 'yaprog';
import prettyBytes from 'pretty-bytes';

export interface BuildReporterOptions {
  assetLogFormat?: string;
  completeChar?: string;
  format?: string;
  incompleteChar?: string;
  width?: number;
}

export function makeBuildReporter(
  opts?: BuildReporterOptions,
): BuildStackReporter {
  const {
    assetLogFormat = `output :path (:psize)`,
    completeChar = '█',
    format = `building :bar :item (:current/:total)`,
    incompleteChar = '░',
    width = 40,
  } = opts || {};

  const bar = makeProgressBar(format, {
    completeChar,
    incompleteChar,
    total: 0,
    width,
  });

  const items = new Set<string>();

  function report({
    asset,
    done,
    current,
    total,
  }: BuildStackReporterItem): void {
    if (current) {
      items.add(current);
      bar.update(items.size, total, { item: current });
    } else if (typeof total === 'number') {
      bar.total = total;
    }
    if (asset) {
      bar.log(assetLogFormat, {
        path: asset.path,
        size: asset.size,
        psize: prettyBytes(asset.size),
      });
    }
    if (done) {
      bar.clear();
    }
  }

  return report;
}
