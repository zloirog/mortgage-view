// Pure calculation engine. Runs in the browser and in Node tests.
// Dates are 'YYYY-MM' strings; month index 0 = first payment month (startDate).

export function monthIndex(startYM, ym) {
  const [sy, sm] = startYM.split('-').map(Number);
  const [y, m] = ym.split('-').map(Number);
  return (y - sy) * 12 + (m - sm);
}

export function addMonths(startYM, n) {
  const [y, m] = startYM.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

export function annuityPayment(balance, r, n) {
  if (n <= 0) return balance;
  if (r === 0) return balance / n;
  return (balance * r) / (1 - Math.pow(1 + r, -n));
}

// Months needed to repay `balance` with fixed payment `pmt` at monthly rate r.
export function nper(balance, r, pmt) {
  if (balance <= 0) return 0;
  if (r === 0) return Math.ceil(balance / pmt);
  if (pmt <= balance * r) return Infinity;
  return Math.ceil(-Math.log(1 - (r * balance) / pmt) / Math.log(1 + r) - 1e-9);
}

export function loanAmount(m) {
  return Math.max(0, (+m.price || 0) - (+m.downPayment || 0));
}

// Expand extra-payment definitions into Map<monthIndex, amount>.
// once: {date, amount}; monthly/yearly: {from, to?, amount}
export function expandExtras(extras = [], startYM, horizon) {
  const out = new Map();
  const add = (i, a) => {
    if (i >= 0 && i < horizon && a > 0) out.set(i, (out.get(i) || 0) + a);
  };
  for (const e of extras) {
    const amount = +e.amount || 0;
    if (!amount) continue;
    if (e.type === 'once') {
      if (e.date) add(monthIndex(startYM, e.date), amount);
    } else {
      const step = e.type === 'yearly' ? 12 : 1;
      const from = e.from ? monthIndex(startYM, e.from) : 0;
      const to = e.to ? monthIndex(startYM, e.to) : horizon - 1;
      let i = from < 0 ? from + Math.ceil(-from / step) * step : from;
      for (; i <= to; i += step) add(i, amount);
    }
  }
  return out;
}

/**
 * Simulate the loan month by month.
 * m:  {price, downPayment, rate, termYears, startDate, type:'annuity'|'linear',
 *      monthlyFees, prepaymentFeePct, rateChanges:[{date, rate}]}
 * sc: {strategy:'term'|'payment', extras:[...]}
 *   strategy 'term'    – extra payments keep the monthly payment, loan ends earlier
 *   strategy 'payment' – extra payments keep the end date, monthly payment drops
 *   Each extra may set its own `strategy`; sc.strategy is the default. When both kinds
 *   fall in the same month, the 'payment' part is applied first (payment recalculated
 *   over the current remaining term), then the 'term' part (payment kept, end moves in).
 */
export function simulate(m, sc = {}) {
  const principal0 = loanAmount(m);
  const n0 = Math.max(1, Math.round((+m.termYears || 0) * 12));
  const start = m.startDate;
  const strategy = sc.strategy || 'term';
  const linear = m.type === 'linear';
  const monthlyFees = +m.monthlyFees || 0;
  const feePct = (+m.prepaymentFeePct || 0) / 100;
  const byStrategy = (s) => expandExtras((sc.extras || []).filter((e) => (e.strategy || strategy) === s), start, n0);
  const extrasTerm = byStrategy('term');
  const extrasPayment = byStrategy('payment');

  let annualRate = +m.rate || 0;
  const changes = new Map();
  for (const rc of m.rateChanges || []) {
    if (!rc.date || rc.rate === '' || rc.rate == null) continue;
    const i = monthIndex(start, rc.date);
    if (i <= 0) annualRate = +rc.rate;
    else changes.set(i, +rc.rate);
  }

  let r = annualRate / 1200;
  let balance = principal0;
  let targetEnd = n0; // month index after the last payment
  let payment = linear ? principal0 / n0 : annuityPayment(principal0, r, n0);
  const rows = [];

  for (let i = 0; i < n0 && balance > 0.005; i++) {
    if (changes.has(i)) {
      annualRate = changes.get(i);
      r = annualRate / 1200;
      if (!linear) payment = annuityPayment(balance, r, targetEnd - i);
    }
    const interest = balance * r;
    let principal;
    let pay;
    if (linear) {
      principal = Math.min(payment, balance);
      pay = principal + interest;
    } else {
      pay = Math.min(payment, balance + interest);
      if (i === targetEnd - 1 || i === n0 - 1) pay = balance + interest;
      principal = pay - interest;
    }
    balance -= principal;

    // lower-the-payment part: keep the current end date, recalculate the payment
    const xPay = Math.min(extrasPayment.get(i) || 0, Math.max(0, balance));
    balance -= xPay;
    if (xPay > 0 && balance > 0.005) {
      const remaining = Math.max(1, targetEnd - (i + 1));
      payment = linear ? balance / remaining : annuityPayment(balance, r, remaining);
    }
    // shorten-the-term part: keep the payment, move the end date in
    const xTerm = Math.min(extrasTerm.get(i) || 0, Math.max(0, balance));
    balance -= xTerm;
    if (xTerm > 0 && balance > 0.005) {
      targetEnd = i + 1 + (linear ? Math.ceil(balance / payment - 1e-9) : nper(balance, r, payment));
    }
    if (balance < 0.005) balance = 0;
    const extra = xPay + xTerm;
    const fee = monthlyFees + extra * feePct;

    rows.push({ i, date: addMonths(start, i), rate: annualRate, payment: pay, interest, principal, extra, fee, balance });
  }

  const sum = (k) => rows.reduce((s, x) => s + x[k], 0);
  const totalInterest = sum('interest');
  const totalFees = sum('fee');
  const totalExtra = sum('extra');
  return {
    principal: principal0,
    rows,
    months: rows.length,
    endDate: rows.length ? rows[rows.length - 1].date : start,
    firstPayment: rows[0] ? rows[0].payment : 0,
    lastPayment: rows.length ? rows[rows.length - 1].payment : 0,
    maxPayment: rows.reduce((mx, x) => Math.max(mx, x.payment), 0),
    totalInterest,
    totalFees,
    totalExtra,
    totalPaid: sum('payment') + totalExtra + totalFees,
  };
}

// Aggregate monthly rows into calendar years.
export function yearly(rows) {
  const by = new Map();
  for (const x of rows) {
    const y = x.date.slice(0, 4);
    const a = by.get(y) || { year: y, payment: 0, interest: 0, principal: 0, extra: 0, fee: 0, balance: 0 };
    a.payment += x.payment;
    a.interest += x.interest;
    a.principal += x.principal;
    a.extra += x.extra;
    a.fee += x.fee;
    a.balance = x.balance;
    by.set(y, a);
  }
  return [...by.values()];
}

export function compareScenario(m, sc) {
  const base = simulate(m, {});
  const res = simulate(m, sc);
  return {
    base,
    res,
    interestSaved: base.totalInterest - res.totalInterest,
    monthsSaved: base.months - res.months,
    netSaved: base.totalInterest + base.totalFees - res.totalInterest - res.totalFees,
  };
}

/**
 * Prepay vs deposit. Both options spend exactly the same cash each month:
 *   budget(i) = baseline mortgage outflow(i) + planned extra money(i)
 * A (prepay):  extra goes to the mortgage; whatever the budget no longer needs
 *              (lower payment / loan finished early) goes to the deposit.
 * B (deposit): mortgage runs as planned; the extra money goes to the deposit.
 * Net worth = deposit balance − remaining mortgage balance.
 * c: {extras, strategy, depositRate, taxPct, horizonYears}
 */
export function prepayVsDeposit(m, c) {
  const n0 = Math.max(1, Math.round((+m.termYears || 0) * 12));
  const H = Math.max(1, Math.round((+c.horizonYears || m.termYears) * 12));
  const base = simulate(m, {});
  const pre = simulate(m, { extras: c.extras, strategy: c.strategy });
  const planned = expandExtras(c.extras, m.startDate, n0);
  const rNet = ((+c.depositRate || 0) * (1 - (+c.taxPct || 0) / 100)) / 1200;
  const out = (row) => (row ? row.payment + row.extra + row.fee : 0);

  let depA = 0;
  let depB = 0;
  let interestB = 0;
  const series = [];
  for (let i = 0; i < H; i++) {
    const budget = out(base.rows[i]) + (planned.get(i) || 0);
    const gainB = depB * rNet;
    interestB += gainB;
    depA = depA * (1 + rNet) + (budget - out(pre.rows[i]));
    depB = depB + gainB + (budget - out(base.rows[i]));
    const balA = pre.rows[i] ? pre.rows[i].balance : 0;
    const balB = base.rows[i] ? base.rows[i].balance : 0;
    series.push({ i, date: addMonths(m.startDate, i), depA, depB, balA, balB, netA: depA - balA, netB: depB - balB });
  }
  const last = series[series.length - 1];
  return {
    base,
    pre,
    series,
    finalA: last.netA,
    finalB: last.netB,
    advantage: last.netA - last.netB, // > 0 → prepaying wins
    interestSaved: base.totalInterest - pre.totalInterest,
    monthsSaved: base.months - pre.months,
    depositInterestB: interestB,
    totalPlanned: [...planned.values()].reduce((s, x) => s + x, 0),
    netDepositRate: (+c.depositRate || 0) * (1 - (+c.taxPct || 0) / 100),
  };
}

// Gross deposit rate at which both options end equal (bisection), or null.
export function breakEvenDepositRate(m, c) {
  const f = (rate) => prepayVsDeposit(m, { ...c, depositRate: rate }).advantage;
  let lo = 0;
  let hi = 40;
  if (f(lo) <= 0 || f(hi) >= 0) return null;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
