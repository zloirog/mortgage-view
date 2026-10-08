import * as E from './engine.js';
import { t, setLang, locale, browserLang, applyStatic } from './i18n.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const nowYM = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

// ───────────────────────── state ─────────────────────────
function defaults() {
  const start = E.addMonths(nowYM(), 2);
  setLang(browserLang());
  return {
    version: 1,
    lang: browserLang(),
    currency: 'CZK',
    status: 'planning',
    takenOn: '',
    tab: 'mortgage',
    mortgage: { price: 6000000, downPayment: 1200000, rate: 4.9, termYears: 30, startDate: start, type: 'annuity', monthlyFees: 0, prepaymentFeePct: 0, rateChanges: [] },
    scenarios: [
      { id: uid(), name: t('defScenario1'), strategy: 'term', extras: [{ type: 'monthly', from: start, to: '', amount: 3000 }] },
      { id: uid(), name: t('defScenario2'), strategy: 'term', extras: [{ type: 'yearly', from: E.addMonths(start, 11), to: '', amount: 100000 }] },
    ],
    activeScenario: null,
    calc: { extras: [{ type: 'once', date: E.addMonths(start, 12), from: '', to: '', amount: 200000 }], strategy: 'term', depositRate: 3.5, taxPct: 15, horizonYears: 30 },
    calculations: [],
  };
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function merge(def, val) {
  if (val === undefined) return def;
  if (isObj(def) && isObj(val)) {
    const o = { ...def };
    for (const k of Object.keys(val)) o[k] = merge(def[k], val[k]);
    return o;
  }
  return val;
}

let state;
const getPath = (p) => p.split('.').reduce((o, k) => o?.[k], state);
function setPath(p, v) {
  const ks = p.split('.');
  const last = ks.pop();
  ks.reduce((o, k) => o[k], state)[last] = v;
}

// ───────────────────────── persistence ─────────────────────────
let saveTimer;
const saveEl = () => $('#save-status');
function scheduleSave() {
  saveEl().textContent = t('saving');
  saveEl().classList.remove('err');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 500);
}
async function save() {
  try {
    const r = await fetch('api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) });
    if (!r.ok) throw new Error(r.status);
    const { savedAt } = await r.json();
    saveEl().textContent = t('saved', { time: new Date(savedAt).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) });
  } catch (e) {
    saveEl().textContent = t('notSaved');
    saveEl().classList.add('err');
  }
}
async function load() {
  try {
    const r = await fetch('api/state');
    const data = r.ok ? await r.json() : {};
    state = merge(defaults(), data);
    setLang(state.lang);
    saveEl().textContent = t(data.savedAt ? 'loaded' : 'fresh');
  } catch {
    state = defaults();
    saveEl().textContent = t('offline');
  }
  if (!state.scenarios.find((s) => s.id === state.activeScenario)) state.activeScenario = state.scenarios[0]?.id ?? null;
}

// ───────────────────────── formatting ─────────────────────────
let fmtMoney, fmtCompact;
function setCurrency(code) {
  try {
    fmtMoney = new Intl.NumberFormat(locale(), { style: 'currency', currency: code, maximumFractionDigits: 0 });
    fmtCompact = new Intl.NumberFormat(locale(), { style: 'currency', currency: code, notation: 'compact', maximumFractionDigits: 1 });
  } catch {
    fmtMoney = new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 });
    fmtCompact = new Intl.NumberFormat(locale(), { notation: 'compact' });
  }
}
const money = (v) => fmtMoney.format(Math.round(v) || 0);
const signed = (v) => (v > 0 ? '+' : '') + money(v);
const num = (v, d = 2) => (+v).toLocaleString(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v, d = 2) => `${num(v, d)}%`;
const ymText = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString(locale(), { month: 'short', year: 'numeric' }); };
function duration(n) {
  const y = Math.floor(Math.abs(n) / 12), m = Math.abs(n) % 12;
  return [y && `${y} ${t('yShort')}`, m && `${m} ${t('moShort')}`].filter(Boolean).join(' ') || `0 ${t('moShort')}`;
}
const kpi = (label, value, sub = '', cls = '') => `<div class="kpi ${cls}"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;

// ───────────────────────── charts ─────────────────────────
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const palette = () => ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'].map(css);
const charts = {};

function chart(id, type, labels, datasets, extra = {}) {
  if (charts[id]) {
    charts[id].data.labels = labels;
    charts[id].data.datasets = datasets;
    charts[id].update('none');
    return;
  }
  Chart.defaults.color = css('--muted');
  Chart.defaults.borderColor = css('--border');
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  charts[id] = new Chart($('#' + id), {
    type,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      elements: { point: { radius: 0, hoverRadius: 4 }, line: { borderWidth: 2, tension: 0 } },
      plugins: {
        legend: { labels: { boxWidth: 12, boxHeight: 12 } },
        tooltip: { callbacks: { title: (it) => (extra.monthly ? ymText(it[0].label) : it[0].label), label: (c) => `${c.dataset.label}: ${money(c.parsed.y)}`, footer: (it) => (extra.stacked && it.length > 1 ? `${t('total')}: ${money(it.reduce((s, x) => s + x.parsed.y, 0))}` : '') } },
      },
      scales: {
        x: { stacked: !!extra.stacked, grid: { display: false }, ticks: { maxTicksLimit: 12, autoSkip: true, maxRotation: 0, callback(v) { const l = this.getLabelForValue(v); return extra.monthly ? l.slice(0, 4) : l; } } },
        y: { stacked: !!extra.stacked, ticks: { callback: (v) => fmtCompact.format(v) } },
      },
    },
  });
}

// ───────────────────────── structure (dynamic lists) ─────────────────────────
function extrasEditor(path) {
  const list = getPath(path);
  const rows = list.map((e, i) => {
    const p = `${path}.${i}`;
    const dates = e.type === 'once'
      ? `<label>${t('month')}<input type="month" placeholder="YYYY-MM" data-bind="${p}.date"></label>`
      : `<label>${t('from')}<input type="month" placeholder="YYYY-MM" data-bind="${p}.from"></label><label>${t('until')}<input type="month" placeholder="YYYY-MM" data-bind="${p}.to"></label>`;
    return `<div class="extra-row">
      <select data-bind="${p}.type" data-rerender aria-label="${t('frequency')}">
        <option value="once">${t('once')}</option><option value="monthly">${t('everyMonth')}</option><option value="yearly">${t('everyYear')}</option>
      </select>
      <button class="icon" data-action="remove" data-path="${path}" data-idx="${i}" title="${t('remove')}">✕</button>
      ${dates}
      <label ${e.type === 'once' ? '' : 'style="grid-column:1/-1"'}>${t('amount')}<input type="number" min="0" step="1000" data-bind="${p}.amount"></label>
    </div>`;
  });
  return rows.join('') + `<button class="ghost" data-action="add-extra" data-path="${path}">${t('addPayment')}</button>`;
}

function renderStructure() {
  document.body.classList.toggle('is-taken', state.status === 'taken');
  setLang(state.lang);
  setCurrency(state.currency);
  applyStatic();

  $$('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
  $$('.tab').forEach((t) => t.classList.toggle('active', t.id === 'tab-' + state.tab));

  // rate changes
  $('#rate-changes').innerHTML = state.mortgage.rateChanges.map((rc, i) => `
    <div class="rc-row">
      <label>${t('from')}<input type="month" placeholder="YYYY-MM" data-bind="mortgage.rateChanges.${i}.date"></label>
      <label>${t('ratePct')}<input type="number" step="0.01" min="0" data-bind="mortgage.rateChanges.${i}.rate"></label>
      <button class="icon" data-action="remove" data-path="mortgage.rateChanges" data-idx="${i}" title="${t('remove')}">✕</button>
    </div>`).join('') + `<button class="ghost" data-action="add-rate">${t('addRate')}</button>`;

  // scenarios
  const pal = palette();
  $('#scenario-list').innerHTML = state.scenarios.map((s, i) => `
    <button data-action="select-scenario" data-id="${s.id}" class="${s.id === state.activeScenario ? 'active' : ''}">
      <span class="swatch" style="background:${pal[i % pal.length]}"></span>${esc(s.name) || t('unnamed')}
    </button>`).join('') + `<button class="ghost" data-action="add-scenario" style="justify-content:center">${t('newScenario')}</button>`;

  const idx = state.scenarios.findIndex((s) => s.id === state.activeScenario);
  $('#scenario-editor').innerHTML = idx < 0 ? `<p class="muted">${t('noScenarios')}</p>` : `
    <label>${t('name')}<input type="text" data-bind="scenarios.${idx}.name" data-rerender></label>
    <label>${t('afterExtra')}
      <select data-bind="scenarios.${idx}.strategy">
        <option value="term">${t('stratTerm')}</option>
        <option value="payment">${t('stratPayment')}</option>
      </select>
    </label>
    <h3>${t('extraPayments')}</h3>
    ${extrasEditor(`scenarios.${idx}.extras`)}
    <div class="row" style="margin-top:14px">
      <button class="ghost" data-action="dup-scenario">${t('duplicate')}</button>
      <button class="danger" data-action="del-scenario">${t('delete')}</button>
    </div>`;

  $('#calc-extras').innerHTML = extrasEditor('calc.extras');

  // fill bound inputs
  for (const el of $$('[data-bind]')) {
    const v = getPath(el.dataset.bind);
    if (document.activeElement !== el) el.value = v ?? '';
  }
}

// ───────────────────────── results ─────────────────────────
function renderMortgage() {
  const m = state.mortgage;
  const s = E.simulate(m);
  const loan = E.loanAmount(m);
  const pal = palette();
  const rows = s.rows;
  const paymentChanges = Math.abs(s.maxPayment - s.firstPayment) > 1 || m.type === 'linear';
  const nowIdx = E.monthIndex(m.startDate, nowYM());
  const nowRow = rows[nowIdx];
  const ltv = m.price ? (loan / m.price) * 100 : 0;

  $('#mortgage-kpis').innerHTML = [
    kpi(t('kLoan'), money(loan), t('kLoanSub', { ltv: pct(ltv, 0), down: money(m.downPayment) })),
    kpi(t('kPayment'), money(s.firstPayment + (+m.monthlyFees || 0)), paymentChanges ? t(m.type === 'linear' ? 'kPayFalls' : 'kPayChanges', { last: money(s.lastPayment), max: money(s.maxPayment) }) : (+m.monthlyFees ? t('kInclFees', { x: money(m.monthlyFees) }) : t('kFixed'))),
    kpi(t('kInterest'), money(s.totalInterest), t('kOfLoan', { p: pct((s.totalInterest / (loan || 1)) * 100, 0) }), 'bad'),
    kpi(t('kTotal'), money(s.totalPaid), +m.monthlyFees ? t('kInclFees', { x: money(s.totalFees) }) : t('kPrincipalInterest')),
    kpi(t('kPaidOff'), ymText(s.endDate), duration(s.months)),
    nowRow ? kpi(t('kToday'), t('kLeft', { x: money(nowRow.balance) }), t('kTodaySub', { i: nowIdx + 1, n: s.months, p: pct(100 - (nowRow.balance / loan) * 100, 0) })) : '',
  ].join('');

  let ci = 0, cp = 0;
  const cumI = [], cumP = [];
  for (const r of rows) { ci += r.interest; cp += r.principal + r.extra; cumI.push(ci); cumP.push(cp); }
  chart('ch-balance', 'line', rows.map((r) => r.date), [
    { label: t('dsBalance'), data: rows.map((r) => r.balance), borderColor: pal[0], backgroundColor: pal[0] + '22', fill: true },
    { label: t('dsInterestCum'), data: cumI, borderColor: pal[1] },
    { label: t('dsPrincipalCum'), data: cumP, borderColor: pal[2], borderDash: [5, 4] },
  ], { monthly: true });

  const ys = E.yearly(rows);
  const ds = [
    { label: t('principal'), data: ys.map((y) => y.principal + y.extra), backgroundColor: pal[2] },
    { label: t('interest'), data: ys.map((y) => y.interest), backgroundColor: pal[1] },
  ];
  if (s.totalFees > 0) ds.push({ label: t('fees'), data: ys.map((y) => y.fee), backgroundColor: css('--c-base') });
  chart('ch-yearly', 'bar', ys.map((y) => y.year), ds, { stacked: true });

  const monthly = $('#monthly-toggle').checked;
  const list = monthly ? rows.map((r) => ({ ...r, label: ymText(r.date), now: r.i === nowIdx })) : ys.map((y) => ({ ...y, label: y.year, now: y.year === nowYM().slice(0, 4) }));
  $('#schedule').innerHTML = `<thead><tr><th>${t(monthly ? 'month' : 'year')}</th>${monthly ? `<th>${t('ratePct')}</th>` : ''}<th>${t('payment')}</th><th>${t('principal')}</th><th>${t('interest')}</th>${s.totalFees ? `<th>${t('fees')}</th>` : ''}<th>${t('balance')}</th></tr></thead><tbody>` +
    list.map((r) => `<tr class="${r.now ? 'now' : ''}"><td>${r.label}</td>${monthly ? `<td>${pct(r.rate)}</td>` : ''}<td>${money(r.payment)}</td><td>${money(r.principal)}</td><td>${money(r.interest)}</td>${s.totalFees ? `<td>${money(r.fee)}</td>` : ''}<td>${money(r.balance)}</td></tr>`).join('') + '</tbody>';
}

// Regular monthly payment incl. fees. The very last month is only a top-up of the remainder,
// so "end" uses the month before it.
const fees = () => +state.mortgage.monthlyFees || 0;
const endIdx = (res) => Math.max(0, res.rows.length - 2);
const payAt = (res, i) => (res.rows[i] ? res.rows[i].payment + fees() : null);

function renderScenarios() {
  const m = state.mortgage;
  const pal = palette();
  const base = E.simulate(m);
  const results = state.scenarios.map((sc) => ({ sc, ...E.compareScenario(m, sc) }));
  const active = results.find((r) => r.sc.id === state.activeScenario);

  $('#scenario-kpis').innerHTML = active ? [
    kpi(t('kSaved'), money(active.interestSaved), t('kInsteadOf', { a: money(active.res.totalInterest), b: money(base.totalInterest) }), 'good'),
    kpi(t('kPaidOff'), ymText(active.res.endDate), active.monthsSaved > 0 ? t('kEarlier', { d: duration(active.monthsSaved) }) : t('kSameDate')),
    kpi(t('kExtraIn'), money(active.res.totalExtra), active.res.totalFees - base.totalFees > 0.5 ? t('kFeesX', { x: money(active.res.totalFees - base.totalFees) }) : ''),
    kpi(t('kPerExtra'), active.res.totalExtra ? num(active.netSaved / active.res.totalExtra) : '—', t('kPerExtraSub')),
    kpi(t('kPayEnd'), money(payAt(active.res, endIdx(active.res))), t('kVsPlan', { x: signed(payAt(active.res, endIdx(active.res)) - payAt(base, endIdx(active.res))) })),
  ].join('') : '';

  const labels = base.rows.map((r) => r.date);
  chart('ch-scenarios', 'line', labels, [
    { label: t('plan'), data: base.rows.map((r) => r.balance), borderColor: css('--c-base'), borderDash: [6, 4] },
    ...results.map((r, i) => ({
      label: r.sc.name || t('unnamed'),
      data: labels.map((_, k) => (r.res.rows[k] ? r.res.rows[k].balance : 0)),
      borderColor: pal[i % pal.length],
      borderWidth: r.sc.id === state.activeScenario ? 3 : 1.5,
    })),
  ], { monthly: true });

  chart('ch-scen-payment', 'line', labels, [
    { label: t('plan'), data: labels.map((_, k) => payAt(base, k)), borderColor: css('--c-base'), borderDash: [6, 4] },
    ...results.map((r, i) => ({ label: r.sc.name || t('unnamed'), data: labels.map((_, k) => payAt(r.res, k)), borderColor: pal[i % pal.length], borderWidth: r.sc.id === state.activeScenario ? 3 : 1.5, stepped: true })),
  ], { monthly: true });

  // full amount paid: principal + interest (+ fees), per scenario
  const all = [{ name: t('plan'), res: base }, ...results.map((r) => ({ name: r.sc.name || t('unnamed'), res: r.res }))];
  const totals = [
    { label: t('principal'), data: all.map((x) => x.res.principal), backgroundColor: pal[2] },
    { label: t('interest'), data: all.map((x) => x.res.totalInterest), backgroundColor: pal[1] },
  ];
  if (all.some((x) => x.res.totalFees > 0)) totals.push({ label: t('fees'), data: all.map((x) => x.res.totalFees), backgroundColor: css('--c-base') });
  chart('ch-scen-total', 'bar', all.map((x) => x.name), totals, { stacked: true });

  const cum = (res) => { let s = 0; const byI = res.rows.map((r) => (s += r.payment + r.extra + r.fee)); return labels.map((_, k) => byI[Math.min(k, byI.length - 1)]); };
  chart('ch-scen-cum', 'line', labels, [
    { label: t('plan'), data: cum(base), borderColor: css('--c-base'), borderDash: [6, 4] },
    ...results.map((r, i) => ({ label: r.sc.name || t('unnamed'), data: cum(r.res), borderColor: pal[i % pal.length], borderWidth: r.sc.id === state.activeScenario ? 3 : 1.5 })),
  ], { monthly: true });

  $('#scenario-table').innerHTML = `<thead><tr><th>${t('thScenario')}</th><th>${t('thMonthly')}</th><th>${t('thTotalPaid')}</th><th>${t('thExtra')}</th><th>${t('thInterest')}</th><th>${t('thSaved')}</th><th>${t('thPaidOff')}</th><th>${t('thEarlier')}</th><th>${t('thPerExtra')}</th></tr></thead><tbody>
    <tr><td>${t('plan')}</td><td>${payRange(base)}</td><td>${money(base.totalPaid)}</td><td>—</td><td>${money(base.totalInterest)}</td><td>—</td><td>${ymText(base.endDate)}</td><td>—</td><td>—</td></tr>` +
    results.map((r, i) => `<tr><td><span class="swatch" style="display:inline-block;background:${pal[i % pal.length]}"></span> ${esc(r.sc.name)}</td>
      <td>${payRange(r.res)}</td><td>${money(r.res.totalPaid)}</td><td>${money(r.res.totalExtra)}</td><td>${money(r.res.totalInterest)}</td><td class="good">${money(r.interestSaved)}</td>
      <td>${ymText(r.res.endDate)}</td><td>${r.monthsSaved > 0 ? duration(r.monthsSaved) : '—'}</td>
      <td>${r.res.totalExtra ? num(r.netSaved / r.res.totalExtra) : '—'}</td></tr>`).join('') + '</tbody>';
}

function payRange(res) {
  const a = payAt(res, 0), b = payAt(res, endIdx(res));
  return Math.abs(a - b) < 1 ? money(a) : `${money(a)} → ${money(b)}`;
}

function calcSummary(c) {
  const parts = c.extras.filter((e) => +e.amount).map((e) => t(e.type === 'once' ? 'sumOnce' : e.type === 'monthly' ? 'sumMonthly' : 'sumYearly', { x: money(e.amount) }));
  return parts.join(' + ') || t('sumNothing');
}

function renderCalc() {
  const m = state.mortgage;
  const c = state.calc;
  const r = E.prepayVsDeposit(m, c);
  const be = E.breakEvenDepositRate(m, c);
  const years = +c.horizonYears || +m.termYears;
  const pal = palette();
  const wins = r.advantage >= 0;

  $('#calc-verdict').className = 'verdict ' + (r.totalPlanned ? (wins ? 'good' : 'bad') : '');
  $('#calc-verdict').innerHTML = !r.totalPlanned ? t('addMoney') :
    `<b>${t(wins ? 'verdictPrepay' : 'verdictDeposit', { x: money(Math.abs(r.advantage)) })}</b> ${t('afterYears', { n: years })}<br>
     <span class="muted">${t('rateLine', { m: pct(m.rate), d: pct(c.depositRate), n: pct(r.netDepositRate) })}
     ${be != null ? t('beLine', { x: pct(be) }) : ''}</span>`;

  $('#calc-kpis').innerHTML = [
    kpi(t('kNetPrepay'), money(r.finalA), t('kAfterY', { n: years }), wins ? 'good' : ''),
    kpi(t('kNetDeposit'), money(r.finalB), t('kAfterY', { n: years }), wins ? '' : 'good'),
    kpi(t('kMortSaved'), money(r.interestSaved), r.monthsSaved > 0 ? t('kEndsEarlier', { d: duration(r.monthsSaved) }) : t('kByPrepaying')),
    kpi(t('kDepInterest'), money(r.depositInterestB), t('kDepInterestSub')),
    kpi(t('kBreakEven'), be != null ? pct(be) : '—', t('kGross')),
  ].join('');

  chart('ch-calc', 'line', r.series.map((x) => x.date), [
    { label: t('dsPrepay'), data: r.series.map((x) => x.netA), borderColor: pal[0] },
    { label: t('dsDeposit'), data: r.series.map((x) => x.netB), borderColor: pal[1] },
    { label: t('dsDiff'), data: r.series.map((x) => x.netA - x.netB), borderColor: css('--c-base'), borderDash: [5, 4], borderWidth: 1.5 },
  ], { monthly: true });

  $('#calc-table').innerHTML = !state.calculations.length ? `<tr><td class="empty">${t('noCalcs')}</td></tr>` :
    `<thead><tr><th>${t('thName')}</th><th>${t('thSavedOn')}</th><th>${t('thExtraMoney')}</th><th>${t('thDeposit')}</th><th>${t('thWhenSaved')}</th><th>${t('thNow')}</th><th></th></tr></thead><tbody>` +
    state.calculations.map((sc) => {
      const live = E.prepayVsDeposit(m, sc.inputs).advantage;
      const res = (v) => `<td class="${v >= 0 ? 'good' : 'bad'}">${t(v >= 0 ? 'winPrepay' : 'winDeposit', { x: money(Math.abs(v)) })}</td>`;
      return `<tr><td>${esc(sc.name)}</td><td>${new Date(sc.savedAt).toLocaleDateString(locale())}</td><td>${calcSummary(sc.inputs)}</td>
        <td>${t('depTax', { r: pct(sc.inputs.depositRate), t: sc.inputs.taxPct })}</td>${res(sc.result.advantage)}${res(live)}
        <td><button class="icon" data-action="load-calc" data-id="${sc.id}" title="${t('load')}">↺</button><button class="icon" data-action="del-calc" data-id="${sc.id}" title="${t('delete')}">✕</button></td></tr>`;
    }).join('') + '</tbody>';
}

function renderResults() {
  if (!state.mortgage.startDate || !/^\d{4}-\d{2}$/.test(state.mortgage.startDate)) return;
  renderMortgage();
  renderScenarios();
  renderCalc();
}

function changed(structural = false) {
  if (structural) renderStructure();
  renderResults();
  scheduleSave();
}

// ───────────────────────── events ─────────────────────────
function readValue(el) {
  if (el.type === 'number') return el.value === '' ? '' : +el.value;
  return el.value;
}

document.addEventListener('input', (e) => {
  const p = e.target.dataset?.bind;
  if (!p) return;
  if (e.target.type === 'month' && e.target.value && !/^\d{4}-\d{2}$/.test(e.target.value)) return; // half-typed fallback text
  setPath(p, readValue(e.target));
  if (!('rerender' in e.target.dataset)) changed();
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.id === 'monthly-toggle') return renderMortgage();
  if (!el.dataset?.bind || !('rerender' in el.dataset)) return;
  const p = el.dataset.bind;
  setPath(p, readValue(el));
  if (p.endsWith('.type')) {
    // switching an extra payment between one-off and recurring: carry the date over
    const x = getPath(p.replace(/\.type$/, ''));
    if (x.type === 'once') x.date ||= x.from || state.mortgage.startDate;
    else x.from ||= x.date || state.mortgage.startDate;
  }
  if (p === 'status' && state.status === 'taken' && !state.takenOn) state.takenOn = nowYM();
  changed(true);
});

const actions = {
  'add-rate'() {
    const last = state.mortgage.rateChanges.at(-1);
    state.mortgage.rateChanges.push({ date: last ? E.addMonths(last.date, 60) : E.addMonths(state.mortgage.startDate, 60), rate: state.mortgage.rate });
  },
  'add-extra'(b) {
    getPath(b.dataset.path).push({ type: 'once', date: state.mortgage.startDate, from: '', to: '', amount: 50000 });
  },
  remove(b) {
    getPath(b.dataset.path).splice(+b.dataset.idx, 1);
  },
  'select-scenario'(b) {
    state.activeScenario = b.dataset.id;
  },
  'add-scenario'() {
    const sc = { id: uid(), name: t('scenarioN', { n: state.scenarios.length + 1 }), strategy: 'term', extras: [{ type: 'once', date: E.addMonths(state.mortgage.startDate, 12), from: '', to: '', amount: 200000 }] };
    state.scenarios.push(sc);
    state.activeScenario = sc.id;
  },
  'dup-scenario'() {
    const src = state.scenarios.find((s) => s.id === state.activeScenario);
    const sc = { ...structuredClone(src), id: uid(), name: `${src.name} ${t('copy')}` };
    state.scenarios.push(sc);
    state.activeScenario = sc.id;
  },
  'del-scenario'() {
    const src = state.scenarios.find((s) => s.id === state.activeScenario);
    if (!confirm(t('confirmDelScenario', { n: src.name }))) return false;
    state.scenarios = state.scenarios.filter((s) => s !== src);
    state.activeScenario = state.scenarios[0]?.id ?? null;
  },
  'save-calc'() {
    const name = $('#calc-name').value.trim() || `${calcSummary(state.calc)} @ ${pct(state.calc.depositRate)}`;
    const r = E.prepayVsDeposit(state.mortgage, state.calc);
    state.calculations.unshift({
      id: uid(), name, savedAt: new Date().toISOString(),
      inputs: structuredClone(state.calc), mortgage: structuredClone(state.mortgage),
      result: { advantage: r.advantage, finalA: r.finalA, finalB: r.finalB, breakEven: E.breakEvenDepositRate(state.mortgage, state.calc) },
    });
    $('#calc-name').value = '';
  },
  'load-calc'(b) {
    state.calc = structuredClone(state.calculations.find((c) => c.id === b.dataset.id).inputs);
  },
  'del-calc'(b) {
    const c = state.calculations.find((x) => x.id === b.dataset.id);
    if (!confirm(t('confirmDel', { n: c.name }))) return false;
    state.calculations = state.calculations.filter((x) => x !== c);
  },
  export() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    a.download = `mortgage-view-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    return false;
  },
};

document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    renderStructure();
    renderResults(); // charts in hidden tabs need a resize once visible
    Object.values(charts).forEach((c) => c.resize());
    return scheduleSave();
  }
  const b = e.target.closest('[data-action]');
  if (!b || !actions[b.dataset.action]) return;
  e.preventDefault();
  if (actions[b.dataset.action](b) === false) return;
  changed(true);
});

$('#import').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!confirm(t('confirmImport'))) return;
    state = merge(defaults(), data);
    changed(true);
  } catch {
    alert(t('badFile'));
  } finally {
    e.target.value = '';
  }
});

// ───────────────────────── boot ─────────────────────────
await load();
renderStructure();
renderResults();
