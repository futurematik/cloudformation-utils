#!/usr/bin/env node
const esmRequire = require('esm')(module);
const { run } = esmRequire('../lib/util/run');
run(esmRequire('../lib/cli/cfn-asset').main);
