/* eslint-disable @typescript-eslint/no-var-requires */
import Debug from 'debug';
const catme = require('cat-me');

const debug = Debug('test-api');

debug(`started`);

console.log(catme());
