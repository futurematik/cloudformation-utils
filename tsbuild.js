const fs = require('fs');
const path = require('path');
const proc = require('child_process');

const PACKAGE_JSON = 'package.json';
const TS_BUILD_CONFIG = 'tsconfig.build.json';

const PACKAGES_DIR = path.join(__dirname, 'packages');

const packages = fs
  .readdirSync(PACKAGES_DIR)
  .map((pkg) => path.resolve(PACKAGES_DIR, pkg));

const refs = {};

for (const pkg of packages) {
  const packageJsonPath = path.join(pkg, PACKAGE_JSON);
  if (!fs.existsSync(packageJsonPath)) {
    continue;
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = [];
  if (packageJson.dependencies) {
    deps.push(...Object.keys(packageJson.dependencies));
  }
  if (packageJson.devDependencies) {
    deps.push(...Object.keys(packageJson.devDependencies));
  }
  refs[packageJson.name] = {
    name: packageJson.name,
    path: pkg,
    deps,
  };
}

for (const pkg of Object.values(refs)) {
  const crossRefs = pkg.deps.filter((x) => x in refs);

  fs.writeFileSync(
    path.join(pkg.path, TS_BUILD_CONFIG),
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/tsconfig',
        extends: './tsconfig.json',
        compilerOptions: {
          declaration: true,
          composite: true,
        },
        references: crossRefs.map((x) => ({
          path: path.join(refs[x].path, TS_BUILD_CONFIG),
        })),
      },
      null,
      2,
    ),
  );
}

fs.writeFileSync(
  path.join(__dirname, TS_BUILD_CONFIG),
  JSON.stringify(
    {
      $schema: 'https://json.schemastore.org/tsconfig',
      files: [],
      references: Object.values(refs).map((x) => ({
        path: path.join(x.path, TS_BUILD_CONFIG),
      })),
    },
    null,
    2,
  ),
);

const result = proc.spawnSync(
  process.argv0,
  [
    path.join(__dirname, 'node_modules/.bin/tsc'),
    '-b',
    path.join(__dirname, TS_BUILD_CONFIG),
    ...process.argv.slice(2),
  ],
  {
    stdio: 'inherit',
  },
);

process.exit(result.status);
