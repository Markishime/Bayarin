const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/services/bill-rules.ts'), 'utf8');
const moduleExports = {};
vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), { exports: moduleExports, Date });
const { validAmount, validDate, billStatus } = moduleExports;

test('monthly dashboard counts payments by payment date and excludes archived or draft bills', () => {
  const base = { status: 'upcoming', due_date: '2026-09-08', reminder_days: 3, amount: 100, paid_at: null };
  const summary = moduleExports.householdSummary([
    base,
    { ...base, amount: 200, status: 'paid', due_date: '2026-08-20', paid_at: '2026-09-02T12:00:00' },
    { ...base, amount: 300, status: 'paid', paid_at: '2026-08-30T12:00:00' },
    { ...base, status: 'draft' }, { ...base, status: 'archived' },
    { ...base, due_date: '2026-10-01' },
  ], new Date('2026-09-05T12:00:00'));
  assert.equal(summary.unpaidAmount, 100);
  assert.equal(summary.paidAmount, 200);
  assert.equal(summary.dueSoonCount, 1);
});
test('reject impossible dates and accept leap days', () => {
  assert.equal(validDate('2026-02-31'), false); assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2028-02-29'), true); assert.equal(validDate('2026-13-01'), false);
});
test('reject nonfinite, negative, zero, and overprecision amounts', () => {
  for (const value of ['NaN', 'Infinity', '-5', '0', '1.234', '1e3', '10000000000']) assert.equal(validAmount(value), false, value);
  for (const value of ['1', '2450.36', ' 299.00 ']) assert.equal(validAmount(value), true, value);
});
test('derive status at date boundaries without changing paid, archived, or draft', () => {
  const now = new Date('2026-09-05T23:30:00');
  const bill = { status: 'upcoming', due_date: '2026-09-04', reminder_days: 5 };
  assert.equal(billStatus(bill, now), 'overdue');
  assert.equal(billStatus({ ...bill, due_date: '2026-09-05' }, now), 'due_soon');
  assert.equal(billStatus({ ...bill, due_date: '2026-09-10' }, now), 'due_soon');
  assert.equal(billStatus({ ...bill, due_date: '2026-09-11' }, now), 'upcoming');
  for (const status of ['paid', 'draft', 'archived']) assert.equal(billStatus({ ...bill, status }, now), status);
});
