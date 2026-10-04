/* The writing-help relay's tests (tools/relay/tests/run.sh): the relay as uploaded, served by PHP's built-in
   server against a local stand-in for the Anthropic API, so nothing leaves this machine. This wrapper starts
   them the way the other qa/wording-*.js tests are started; any arguments go to run.sh (for example --php81).
   usage: node qa/wording-relay-test.js [--php81] */
'use strict';
const {spawnSync} = require('child_process'), path = require('path');
const run = path.join(__dirname, '..', 'tools', 'relay', 'tests', 'run.sh');
const r = spawnSync('bash', [run, ...process.argv.slice(2)], {stdio: 'inherit'});
process.exit(r.status === null ? 1 : r.status);
