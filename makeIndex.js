const fs = require('fs');
const ignore = require('ignore');
const minimist = require('minimist');
const path = require('path');

const opts = minimist(process.argv.slice(2));
const dirs = opts._.length ? opts._ : [process.cwd()];
const depth = opts.depth && parseInt(opts.depth, 10);

const defaultIgnore = ignore().add([
  'internal/',
  '*.internal.*',
  '*.test.ts',
  '*.d.ts',
  '__test__/',
]);

dirs.forEach((x) => makeIndex(x, depth, opts.comment));

function makeIndex(dir, maxDepth, comment) {
  const files = collectFiles(dir, { maxDepth })
    .map((x) => path.relative(dir, x).replace('\\', '/'))
    .sort(sortPath)
    .filter((x) => x !== 'index');

  if (!comment) {
    comment = `node ${path.relative(dir, __filename)}`;
  }

  const index = [`// AUTO-GENERATED ${comment}`].concat(
    files.map((x) => `export * from './${x}';`),
  );
  fs.writeFileSync(path.join(dir, 'index.ts'), index.join('\n') + '\n');
}

function collectFiles(
  dir,
  {
    currentDepth = 0,
    ignoreFiles = defaultIgnore,
    maxDepth = 5,
    rootDir = dir,
  },
) {
  const ignorePath = path.join(dir, '.indexignore');
  if (fs.existsSync(ignorePath)) {
    ignoreFiles = ignore()
      .add(ignoreFiles)
      .add(fs.readFileSync(ignorePath, 'utf8'));
  }
  let files = fs.readdirSync(dir, { withFileTypes: true });
  const matches = [];

  if (currentDepth > 0 && files.find((x) => x.name === 'index.ts')) {
    return [dir];
  }

  for (const file of files) {
    const relPath = getIgnorePath(dir, file, rootDir);
    if (ignoreFiles && ignoreFiles.ignores(relPath)) {
      continue;
    }
    if (file.isDirectory() && currentDepth <= maxDepth) {
      matches.push(
        ...collectFiles(path.join(dir, file.name), {
          currentDepth: currentDepth + 1,
          ignoreFiles,
          maxDepth,
          rootDir,
        }),
      );
    } else if (shouldIndexFile(file.name)) {
      matches.push(
        path.join(dir, path.basename(file.name, path.extname(file.name))),
      );
    }
  }

  return matches;
}

function shouldIndexFile(name) {
  return /\.tsx?$/.test(name);
}

function getIgnorePath(dir, file, rootDir) {
  let filePath = path.relative(rootDir, path.join(dir, file.name));
  if (file.isDirectory()) {
    filePath += '/';
  }
  return filePath;
}

function sortPath(a, b) {
  const aParts = a.split('/');
  const bParts = b.split('/');

  if (aParts.length > bParts.length) {
    return -1;
  } else if (aParts.length < bParts.length) {
    return 1;
  }

  return a.toLowerCase().localeCompare(b.toLowerCase());
}
