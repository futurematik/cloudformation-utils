#!/usr/bin/env node
const esmRequire = require('esm')(module);
const { run } = esmRequire('@fmtk/async-main');
run(esmRequire('../lib/cli/cfn-asset').main);
