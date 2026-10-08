import { test } from 'node:test';
import assert from 'node:assert/strict';
import { annuityPayment, simulate, prepayVsDeposit, breakEvenDepositRate, addMonths, monthIndex, nper } from '../public/engine.js';

const m = { price: 300000, downPayment: 60000, rate: 4.5, termYears: 30, startDate: '2027-01', type: 'annuity', monthlyFees: 0, prepaymentFeePct: 0, rateChanges: [] };
const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('dates', () => {
  assert.equal(addMonths('2027-11', 3), '2028-02');
  assert.equal(monthIndex('2027-11', '2028-02'), 3);
});

test('annuity matches textbook payment and fully repays', () => {
  const s = simulate(m);
  close(s.firstPayment, 1216.04); // 240k @ 4.5% / 30y
  assert.equal(s.months, 360);
  assert.equal(s.rows.at(-1).balance, 0);
  close(s.rows.reduce((a, x) => a + x.principal, 0), 240000);
});

test('linear: constant principal part', () => {
  const s = simulate({ ...m, type: 'linear' });
  close(s.rows[0].principal, 240000 / 360);
  close(s.rows[0].payment, 240000 / 360 + 900);
  assert.equal(s.months, 360);
});

test('extra payment, reduce term: same payment, ends earlier', () => {
  const s = simulate(m, { strategy: 'term', extras: [{ type: 'once', date: '2028-01', amount: 30000 }] });
  close(s.rows[20].payment, 1216.04);
  assert.ok(s.months < 360 && s.months > 250);
  assert.equal(s.rows.at(-1).balance, 0);
});

test('extra payment, reduce payment: same end, lower payment', () => {
  const s = simulate(m, { strategy: 'payment', extras: [{ type: 'once', date: '2028-01', amount: 30000 }] });
  assert.equal(s.months, 360);
  assert.ok(s.rows[20].payment < 1216);
  close(s.rows.at(-1).balance, 0);
});

test('rate change recomputes annuity payment', () => {
  const s = simulate({ ...m, rateChanges: [{ date: '2032-01', rate: 6 }] });
  assert.ok(s.rows[60].payment > s.rows[59].payment);
  assert.equal(s.months, 360);
});

test('nper inverse of annuity', () => {
  assert.equal(nper(240000, 0.045 / 12, annuityPayment(240000, 0.045 / 12, 360)), 360);
});

test('prepay vs deposit: with zero deposit rate prepaying wins; at huge rate deposit wins', () => {
  const c = { extras: [{ type: 'once', date: '2027-06', amount: 20000 }], strategy: 'term', taxPct: 0, horizonYears: 30 };
  assert.ok(prepayVsDeposit(m, { ...c, depositRate: 0 }).advantage > 0);
  assert.ok(prepayVsDeposit(m, { ...c, depositRate: 10 }).advantage < 0);
  const be = breakEvenDepositRate(m, c);
  assert.ok(be > 4 && be < 5, `break-even ${be}`); // ≈ mortgage rate without tax
  const beTaxed = breakEvenDepositRate(m, { ...c, taxPct: 20 });
  assert.ok(beTaxed > be, 'tax raises the needed gross rate');
});
