const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(os, openURL) {
  const exports = {};
  vm.runInNewContext(ts.transpile(fs.readFileSync(require('node:path').join(__dirname, '../src/services/external.ts'), 'utf8'), { module: ts.ModuleKind.CommonJS }), { exports, require: () => ({ Platform: { OS: os }, Linking: { openURL } }) });
  return exports;
}
test('wallet links fall back to official sites when native apps are unavailable', async () => {
  const opened = [];
  const api = load('ios', async url => { opened.push(url); if (!url.startsWith('https:')) throw new Error('App not installed'); });
  await api.openPaymentDestination('GCash');
  await api.openPaymentDestination('Maya');
  assert.deepEqual(opened, ['gcash://', 'https://gcash.com/', 'paymaya://', 'https://www.maya.ph/']);
});
test('provider and bank destinations resolve; unknown providers never open a guessed URL', async () => {
  const opened = [];
  const api = load('web', async url => opened.push(url));
  assert.equal(api.providerUrl(' PLDT Home '), 'https://my.pldthome.com/');
  await api.openPaymentDestination('BPI');
  await assert.rejects(api.openPaymentDestination('Provider', 'Unknown utility'), /official app/);
  assert.deepEqual(opened, ['https://online.bpi.com.ph/']);
});
