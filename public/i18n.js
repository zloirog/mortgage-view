// UI strings. t('key', {var}) replaces {var} placeholders.
const dict = {
  en: {
    // header
    status: 'Status', planning: 'Planning', taken: 'Taken', since: 'since', currency: 'Currency', language: 'Language',
    export: 'Export', exportTitle: 'Download all data as JSON', import: 'Import', importTitle: 'Restore from an exported JSON',
    saving: 'Saving…', saved: 'Saved ✓ {time}', notSaved: 'Not saved — server unreachable', loaded: 'Loaded ✓', fresh: 'New — not saved yet', offline: 'Offline',
    // tabs
    tabMortgage: 'Mortgage', tabScenarios: 'Scenarios', tabCalc: 'Prepay vs Deposit',
    // mortgage form
    loan: 'Loan', price: 'Property price', downPayment: 'Down payment', rate: 'Interest rate, % / year', term: 'Term, years',
    firstPayment: 'First payment', repaymentType: 'Repayment type', annuity: 'Annuity (equal payments)', linear: 'Linear (equal principal)',
    monthlyFees: 'Monthly fees / insurance', prepayFee: 'Early-repayment fee, %', rateChanges: 'Expected rate changes',
    rateChangesHint: 'e.g. when the fixed period ends', from: 'From', ratePct: 'Rate %', addRate: '+ Add rate change', remove: 'Remove',
    // mortgage results
    chBalance: 'Balance & cumulative cost', chYearly: "Where each year's money goes", schedule: 'Schedule', monthlyToggle: 'monthly',
    kLoan: 'Loan amount', kLoanSub: 'LTV {ltv} · down {down}', kPayment: 'Monthly payment', kPayFalls: 'falls to {last}, max {max}',
    kPayChanges: 'changes to {last}, max {max}', kInclFees: 'incl. {x} fees', kFixed: 'fixed', kInterest: 'Total interest', kOfLoan: '{p} of the loan',
    kTotal: 'Total you pay', kPrincipalInterest: 'principal + interest', kPaidOff: 'Paid off', kToday: 'Today', kLeft: '{x} left',
    kTodaySub: 'payment {i} of {n} · {p} repaid',
    dsBalance: 'Remaining balance', dsInterestCum: 'Interest paid (cumulative)', dsPrincipalCum: 'Principal repaid (cumulative)',
    principal: 'Principal', interest: 'Interest', fees: 'Fees', month: 'Month', year: 'Year', payment: 'Payment', balance: 'Balance',
    // scenarios
    scenarios: 'Scenarios', newScenario: '+ New scenario', unnamed: '(unnamed)', name: 'Name', afterExtra: 'After an extra payment',
    stratTerm: 'Shorten the term (keep payment)', stratPayment: 'Lower the payment (keep term)', extraPayments: 'Extra payments',
    duplicate: 'Duplicate', delete: 'Delete', noScenarios: 'Create a scenario to compare early repayments against the plan.',
    scenarioN: 'Scenario {n}', copy: '(copy)', defScenario1: '+3 000 every month', defScenario2: 'Yearly bonus 100k',
    once: 'One-off payment', everyMonth: 'Every month', everyYear: 'Every year', frequency: 'Frequency', until: 'Until (optional)', amount: 'Amount',
    addPayment: '+ Add payment', chScenarios: 'Remaining balance: plan vs scenarios', comparison: 'Comparison', plan: 'Plan (no extra)',
    kSaved: 'Interest saved', kInsteadOf: '{a} instead of {b}', kEarlier: '{d} earlier', kSameDate: 'same date', kExtraIn: 'Extra money put in',
    kFeesX: 'fees {x}', kPerExtra: 'Saved per 1 extra', kPerExtraSub: 'interest saved ÷ extra paid',
    useFor: 'Use it to',
    chScenPayment: 'Monthly payment (without extra payments)', thMonthly: 'Monthly payment', kPayEnd: 'Monthly payment at the end', kVsPlan: '{x} vs plan',
    chScenTotal: 'Full amount paid: principal + interest', chScenCum: 'Total paid so far (cumulative)', thTotalPaid: 'Total paid', total: 'Total',
    thScenario: 'Scenario', thExtra: 'Extra paid', thInterest: 'Total interest', thSaved: 'Interest saved', thPaidOff: 'Paid off', thEarlier: 'Earlier by', thPerExtra: 'Saved per 1 extra',
    // calc
    extraMoney: 'Extra money', extraMoneyHint: 'What you could put into the mortgage — or into a deposit instead.', ifPrepaying: 'If prepaying',
    deposit: 'Deposit', depositRate: 'Deposit rate, % / year', tax: 'Tax on interest, %', horizon: 'Compare after, years',
    saveCalc: 'Save this calculation', saveCalcPh: 'e.g. 200k bonus, 3.5% deposit', save: 'Save', chCalc: 'Net worth: deposit − remaining mortgage',
    myCalcs: 'My calculations', sumOnce: '{x} once', sumMonthly: '{x}/mo', sumYearly: '{x}/yr', sumNothing: 'nothing',
    addMoney: 'Add some extra money on the left to compare.',
    verdictPrepay: 'Prepaying the mortgage comes out ahead by {x}', verdictDeposit: 'The deposit comes out ahead by {x}', afterYears: 'after {n} years.',
    rateLine: 'Mortgage rate {m} vs deposit {d} → {n} after tax.', beLine: 'The deposit would need more than <b>{x}</b> gross to win.',
    kNetPrepay: 'Net worth if you prepay', kNetDeposit: 'Net worth with the deposit', kAfterY: 'after {n} y', kMortSaved: 'Mortgage interest saved',
    kEndsEarlier: 'loan ends {d} earlier', kByPrepaying: 'by prepaying', kDepInterest: 'Deposit interest earned', kDepInterestSub: 'after tax, deposit option',
    kBreakEven: 'Break-even deposit rate', kGross: 'gross, before tax',
    dsPrepay: 'Prepay', dsDeposit: 'Deposit', dsDiff: 'Difference (prepay − deposit)',
    noCalcs: 'No saved calculations yet. Save one from the left panel.', thName: 'Name', thSavedOn: 'Saved', thExtraMoney: 'Extra money', thDeposit: 'Deposit',
    thWhenSaved: 'When saved', thNow: 'With the current mortgage', winPrepay: 'Prepay +{x}', winDeposit: 'Deposit +{x}', depTax: '{r} −{t}% tax', load: 'Load into calculator',
    methodTitle: 'How is this calculated?',
    method1: 'Both options spend <b>exactly the same cash every month</b>: your normal mortgage payment plus the extra money.',
    method2: '<b>Prepay</b>: the extra goes into the mortgage. Whatever you stop paying the bank later (lower payment, or the loan ends early) goes into the deposit.',
    method3: '<b>Deposit</b>: the mortgage runs as planned and the extra goes into the deposit, earning interest after tax, compounded monthly.',
    method4: "At the comparison date: net worth = deposit − remaining mortgage. Rule of thumb: prepaying wins when the mortgage rate is higher than the deposit rate after tax. Not modelled: changes in the deposit rate, inflation, tax relief on mortgage interest, and liquidity. Money in a deposit can be withdrawn; money paid into a mortgage can't.",
    // dialogs & misc
    confirmDelScenario: 'Delete scenario "{n}"?', confirmDel: 'Delete "{n}"?', confirmImport: 'Replace all current data with this file?', badFile: 'That file is not a valid export.',
    yShort: 'y', moShort: 'mo',
  },
  ru: {
    status: 'Статус', planning: 'Планирую', taken: 'Взята', since: 'с', currency: 'Валюта', language: 'Язык',
    export: 'Экспорт', exportTitle: 'Скачать все данные в JSON', import: 'Импорт', importTitle: 'Восстановить из экспортированного JSON',
    saving: 'Сохранение…', saved: 'Сохранено ✓ {time}', notSaved: 'Не сохранено — сервер недоступен', loaded: 'Загружено ✓', fresh: 'Новое — ещё не сохранено', offline: 'Нет связи',
    tabMortgage: 'Ипотека', tabScenarios: 'Сценарии', tabCalc: 'Досрочка или вклад',
    loan: 'Кредит', price: 'Стоимость недвижимости', downPayment: 'Первоначальный взнос', rate: 'Ставка, % годовых', term: 'Срок, лет',
    firstPayment: 'Первый платёж', repaymentType: 'Тип платежа', annuity: 'Аннуитетный (равные платежи)', linear: 'Дифференцированный (равный основной долг)',
    monthlyFees: 'Ежемесячные комиссии / страховка', prepayFee: 'Комиссия за досрочное погашение, %', rateChanges: 'Ожидаемые изменения ставки',
    rateChangesHint: 'например, когда закончится фиксация ставки', from: 'С', ratePct: 'Ставка %', addRate: '+ Добавить изменение ставки', remove: 'Удалить',
    chBalance: 'Остаток долга и накопленные выплаты', chYearly: 'Куда уходят деньги каждый год', schedule: 'График платежей', monthlyToggle: 'помесячно',
    kLoan: 'Сумма кредита', kLoanSub: 'LTV {ltv} · взнос {down}', kPayment: 'Ежемесячный платёж', kPayFalls: 'снижается до {last}, макс. {max}',
    kPayChanges: 'меняется до {last}, макс. {max}', kInclFees: 'вкл. комиссии {x}', kFixed: 'фиксированный', kInterest: 'Всего процентов', kOfLoan: '{p} от суммы кредита',
    kTotal: 'Всего заплатите', kPrincipalInterest: 'долг + проценты', kPaidOff: 'Погашение', kToday: 'Сегодня', kLeft: 'осталось {x}',
    kTodaySub: 'платёж {i} из {n} · погашено {p}',
    dsBalance: 'Остаток долга', dsInterestCum: 'Уплачено процентов (нарастающим итогом)', dsPrincipalCum: 'Погашено долга (нарастающим итогом)',
    principal: 'Основной долг', interest: 'Проценты', fees: 'Комиссии', month: 'Месяц', year: 'Год', payment: 'Платёж', balance: 'Остаток',
    scenarios: 'Сценарии', newScenario: '+ Новый сценарий', unnamed: '(без названия)', name: 'Название', afterExtra: 'После досрочного платежа',
    stratTerm: 'Сократить срок (платёж прежний)', stratPayment: 'Уменьшить платёж (срок прежний)', extraPayments: 'Досрочные платежи',
    duplicate: 'Дублировать', delete: 'Удалить', noScenarios: 'Создайте сценарий, чтобы сравнить досрочные погашения с планом.',
    scenarioN: 'Сценарий {n}', copy: '(копия)', defScenario1: '+3 000 каждый месяц', defScenario2: 'Годовая премия 100 тыс.',
    once: 'Разовый платёж', everyMonth: 'Каждый месяц', everyYear: 'Каждый год', frequency: 'Периодичность', until: 'До (необязательно)', amount: 'Сумма',
    addPayment: '+ Добавить платёж', chScenarios: 'Остаток долга: план и сценарии', comparison: 'Сравнение', plan: 'План (без досрочек)',
    kSaved: 'Экономия на процентах', kInsteadOf: '{a} вместо {b}', kEarlier: 'на {d} раньше', kSameDate: 'в тот же срок', kExtraIn: 'Внесено досрочно',
    kFeesX: 'комиссии {x}', kPerExtra: 'Экономия на 1 досрочно', kPerExtraSub: 'экономия ÷ досрочные платежи',
    useFor: 'Направить на',
    chScenPayment: 'Ежемесячный платёж (без досрочных)', thMonthly: 'Ежемесячный платёж', kPayEnd: 'Платёж в конце срока', kVsPlan: '{x} к плану',
    chScenTotal: 'Полная сумма выплат: основной долг + проценты', chScenCum: 'Выплачено нарастающим итогом', thTotalPaid: 'Всего выплачено', total: 'Итого',
    thScenario: 'Сценарий', thExtra: 'Внесено досрочно', thInterest: 'Всего процентов', thSaved: 'Экономия', thPaidOff: 'Погашение', thEarlier: 'Раньше на', thPerExtra: 'Экономия на 1',
    extraMoney: 'Свободные деньги', extraMoneyHint: 'Что можно внести в ипотеку — или вместо этого положить на вклад.', ifPrepaying: 'При досрочном погашении',
    deposit: 'Вклад', depositRate: 'Ставка вклада, % годовых', tax: 'Налог на проценты, %', horizon: 'Сравнить через, лет',
    saveCalc: 'Сохранить расчёт', saveCalcPh: 'напр. премия 200 тыс., вклад 3,5%', save: 'Сохранить', chCalc: 'Капитал: вклад − остаток ипотеки',
    myCalcs: 'Мои расчёты', sumOnce: '{x} разово', sumMonthly: '{x}/мес', sumYearly: '{x}/год', sumNothing: 'ничего',
    addMoney: 'Добавьте слева свободные деньги для сравнения.',
    verdictPrepay: 'Досрочное погашение выгоднее на {x}', verdictDeposit: 'Вклад выгоднее на {x}', afterYears: 'через {n} г.',
    rateLine: 'Ставка ипотеки {m}, вклада {d} → {n} после налога.', beLine: 'Чтобы вклад выиграл, нужна ставка выше <b>{x}</b> (до налога).',
    kNetPrepay: 'Капитал при досрочке', kNetDeposit: 'Капитал со вкладом', kAfterY: 'через {n} г.', kMortSaved: 'Экономия на процентах',
    kEndsEarlier: 'кредит закончится на {d} раньше', kByPrepaying: 'при досрочке', kDepInterest: 'Доход по вкладу', kDepInterestSub: 'после налога, вариант со вкладом',
    kBreakEven: 'Ставка безубыточности', kGross: 'по вкладу, до налога',
    dsPrepay: 'Досрочка', dsDeposit: 'Вклад', dsDiff: 'Разница (досрочка − вклад)',
    noCalcs: 'Сохранённых расчётов пока нет. Сохраните расчёт на левой панели.', thName: 'Название', thSavedOn: 'Дата', thExtraMoney: 'Свободные деньги', thDeposit: 'Вклад',
    thWhenSaved: 'При сохранении', thNow: 'С текущей ипотекой', winPrepay: 'Досрочка +{x}', winDeposit: 'Вклад +{x}', depTax: '{r} −{t}% налог', load: 'Загрузить в калькулятор',
    methodTitle: 'Как это считается?',
    method1: 'Оба варианта тратят <b>одну и ту же сумму каждый месяц</b>: обычный платёж по ипотеке плюс свободные деньги.',
    method2: '<b>Досрочка</b>: свободные деньги идут в ипотеку. Всё, что потом не нужно платить банку (меньший платёж или кредит закончился раньше), идёт на вклад.',
    method3: '<b>Вклад</b>: ипотека идёт по плану, а свободные деньги лежат на вкладе под проценты после налога с ежемесячной капитализацией.',
    method4: 'На дату сравнения: капитал = вклад − остаток ипотеки. Простое правило: досрочка выгоднее, если ставка ипотеки выше ставки вклада после налога. Не учитывается: изменение ставки вклада, инфляция, налоговый вычет по процентам ипотеки и ликвидность. Деньги со вклада можно снять, а внесённые в ипотеку — нет.',
    confirmDelScenario: 'Удалить сценарий «{n}»?', confirmDel: 'Удалить «{n}»?', confirmImport: 'Заменить все текущие данные содержимым этого файла?', badFile: 'Этот файл не является корректным экспортом.',
    yShort: 'г.', moShort: 'мес.',
  },
};

let lang = 'en';
export const setLang = (l) => { lang = dict[l] ? l : 'en'; document.documentElement.lang = lang; };
export const getLang = () => lang;
export const locale = () => (lang === 'ru' ? 'ru-RU' : 'en-GB');
export const browserLang = () => (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';

export function t(key, vars = {}) {
  const s = dict[lang][key] ?? dict.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// Translate static markup: data-i18n (text), data-i18n-html, data-i18n-ph (placeholder), data-i18n-title.
export function applyStatic(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
}
