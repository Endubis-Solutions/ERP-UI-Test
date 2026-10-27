'use strict';

/**
 * Headless smoke test driven over the Chrome DevTools Protocol.
 * Requires Chrome running with --remote-debugging-port=9222.
 */

const BASE = 'http://127.0.0.1:9222';
const APP = process.env.APP_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const targets = await (await fetch(`${BASE}/json/list`)).json();
  const page = targets.find((target) => target.type === 'page');
  if (!page) throw new Error('No page target available');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const problems = [];

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      problems.push(`exception: ${message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text}`);
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      problems.push(`console: ${message.params.entry.text}`);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  };

  const check = async (label, expression, expected) => {
    const actual = await evaluate(expression);
    const ok = typeof expected === 'function' ? expected(actual) : actual === expected;
    console.log(`${ok ? 'PASS' : 'FAIL'} · ${label} -> ${JSON.stringify(actual)}`);
    if (!ok) problems.push(`${label} expected ${String(expected)} but got ${JSON.stringify(actual)}`);
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Page.navigate', { url: APP });
  await sleep(2500);

  await check('KPI cards rendered', `document.querySelectorAll('#kpi-grid article').length`, (n) => n === 6);
  await check('Alert feed rendered', `document.querySelectorAll('#alerts-feed article').length`, (n) => n >= 3);
  await check('Chat seeded', `document.querySelectorAll('#chat-messages > *').length`, (n) => n >= 2);
  await evaluate(`document.querySelector('#location-button').click()`);
  await check('Location menu opens', `!document.querySelector('#location-menu').classList.contains('hidden')`, true);
  await evaluate(`document.querySelector('[data-location="nairobi"]').click()`);
  await sleep(1500);
  await check('Location switched to Nairobi', `document.querySelector('#location-label').textContent.trim()`, 'Nairobi');
  await check('Currency switched to KES', `document.querySelector('#kpi-grid').innerText.includes('Ksh') || document.querySelector('#kpi-grid').innerText.includes('KES')`, true);
  await check('Clock timezone switched', `document.querySelector('#header-tz').textContent.trim()`, 'EAT');

  await evaluate(`document.querySelector('#revenue-subnav [data-view="revenue"]').click()`);
  await sleep(400);
  await check('Revenue view visible', `!document.querySelector('section[data-view="revenue"]').classList.contains('hidden')`, true);
  await check('Revenue title', `document.title.includes('Revenue')`, true);

  await evaluate(`document.querySelector('[data-view="summary"]').click()`);
  await sleep(300);
  await evaluate(`document.querySelector('[data-alert-filter="high"]').click()`);
  await check('Severity filter keeps alerts', `document.querySelectorAll('#alerts-feed article').length > 0`, true);
  await evaluate(`document.querySelector('[data-alert-filter="all"]').click()`);

  await evaluate(`document.querySelector('#alerts-feed [data-action="investigate"]').click()`);
  await sleep(250);
  await check('Drawer opens', `!document.querySelector('#alert-drawer').classList.contains('hidden')`, true);
  await check('Drawer has evidence', `document.querySelectorAll('#drawer-panel li').length >= 3`, true);
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(200);
  await check('Escape closes drawer', `document.querySelector('#alert-drawer').classList.contains('hidden')`, true);

  await evaluate(`(() => { const input = document.querySelector('#search-input'); input.focus(); input.value = 'switch to addis'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(250);
  await check('Search returns matches', `document.querySelectorAll('#search-results [data-search-index]').length > 0`, true);
  await evaluate(`document.querySelector('#search-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`);
  await sleep(1500);
  await check('Search activated location switch', `document.querySelector('#location-label').textContent.trim()`, 'Addis Ababa');

  const before = await evaluate(`document.querySelectorAll('#chat-messages > *').length`);
  await evaluate(`(() => { const form = document.querySelector('#chat-form'); const input = document.querySelector('#chat-input'); input.value = 'summarise yesterday'; form.requestSubmit(); return true; })()`);
  await sleep(1800);
  await check('Chat answered', `document.querySelectorAll('#chat-messages > *').length > ${before}`, true);
  await check('Chat reply has numbers', `document.querySelector('#chat-messages').innerText.includes('%')`, true);

  await evaluate(`document.querySelector('#bell-button').click()`);
  await check('Notifications open', `!document.querySelector('#notification-menu').classList.contains('hidden')`, true);
  await evaluate(`document.querySelector('[data-notification="sync"]').click()`);
  await sleep(300);
  await check('Notification jumps to sync', `document.title.includes('PMS Sync')`, true);

  await evaluate(`document.querySelector('.nav-item[data-view="settings"]').click()`);
  await sleep(300);
  await evaluate(`(() => { const toggle = document.querySelector('[data-pref="weeklyDigest"]'); toggle.checked = true; toggle.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await check('Preference persisted', `JSON.parse(localStorage.getItem('mv-exec-settings')).weeklyDigest`, true);
  await evaluate(`(() => { const toggle = document.querySelector('[data-pref="weeklyDigest"]'); toggle.checked = false; toggle.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);

  await evaluate(`document.querySelector('.nav-item[data-view="summary"]').click()`);
  await sleep(400);
  const openBefore = Number(await evaluate(`document.querySelector('#alert-count').textContent`));
  await evaluate(`document.querySelector('#alerts-feed [data-action="train"]').click()`);
  await sleep(1600);
  await check('Training decrements open flags', `Number(document.querySelector('#alert-count').textContent)`, openBefore - 1);
  await check('Trained drawer closed', `document.querySelector('#alert-drawer').classList.contains('hidden')`, true);

  await evaluate(`document.querySelector('.nav-item[data-view="settings"]').click()`);
  await sleep(400);
  await evaluate(`document.querySelector('section[data-view="settings"] [data-action="reset-training"]').click()`);
  await sleep(1600);
  await check('Reset restores training memory', `Number(document.querySelector('#alert-count').textContent) > ${openBefore - 1}`, true);
  await evaluate(`document.querySelector('section[data-view="settings"] [data-action="save-settings"]').click()`);
  await sleep(250);
  await check('Settings actions are clickable', `document.querySelector('#toast-region').innerText.toLowerCase().includes('preferences saved')`, true);

  await evaluate(`document.querySelector('[data-action="sync"]').click()`);
  await sleep(1800);
  await check('PMS sync refreshes timestamp', `document.querySelector('#sync-relative').textContent.trim()`, 'just now');

  await evaluate(`document.querySelector('#revenue-subnav [data-department="bar"]').click()`);
  await sleep(500);
  await check('Subnav selects department', `document.querySelector('[data-department-pill="bar"]').getAttribute('aria-pressed')`, 'true');
  await check('Department detail rendered', `document.querySelector('section[data-view="revenue"]').innerText.includes('Bar')`, true);
  await evaluate(`document.querySelector('section[data-view="revenue"] [data-department-pill="events"]').click()`);
  await sleep(400);
  await check('Department pill switches in place', `document.querySelector('[data-department-pill="events"]').getAttribute('aria-pressed')`, 'true');

  await evaluate(`document.querySelector('.nav-item[data-view="ledger"]').click()`);
  await sleep(1400);
  await check('Ledger table renders first page', `document.querySelectorAll('#ledger-table tbody tr').length`, (n) => n === 25);
  await check(
    'Ledger ties to departmental totals',
    `document.querySelector('section[data-view="ledger"]').innerText.includes('Ties to the departmental totals')`,
    true,
  );
  await check('Ledger lists every posting', `document.querySelector('#ledger-pagination').innerText.includes('of 48')`, true);

  await evaluate(`document.querySelector('#ledger-direction [data-ledger-direction="revenue"]').click()`);
  await sleep(250);
  await check('Ledger revenue filter', `document.querySelector('#ledger-count').innerText.includes('23 of 48 postings')`, true);
  await evaluate(`document.querySelector('#ledger-direction [data-ledger-direction="all"]').click()`);
  await evaluate(
    `(() => { const select = document.querySelector('#ledger-department'); select.value = 'Bar'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`,
  );
  await sleep(250);
  await check('Ledger department filter', `document.querySelectorAll('#ledger-table tbody tr').length`, (n) => n === 8);
  await evaluate(
    `(() => { const input = document.querySelector('#ledger-search'); input.value = 'payroll'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`,
  );
  await sleep(250);
  await check('Ledger search narrows rows', `document.querySelectorAll('#ledger-table tbody tr').length`, (n) => n === 1);
  await evaluate(`document.querySelector('section[data-view="ledger"] [data-action="ledger-reset"]').click()`);
  await sleep(250);
  await check('Ledger clear resets filters', `document.querySelector('#ledger-count').innerText.includes('48 of 48 postings')`, true);
  await evaluate(`document.querySelector('#ledger-table [data-ledger-sort="amount"]').click()`);
  await sleep(250);
  await check(
    'Ledger sorts by amount',
    `document.querySelector('#ledger-table thead th[aria-sort="descending"] button').textContent.includes('Amount')`,
    true,
  );
  await evaluate(`document.querySelector('#ledger-pagination [data-action="ledger-next"]').click()`);
  await sleep(250);
  await check('Ledger pager advances', `document.querySelector('#ledger-pagination').innerText.includes('2 / 2')`, true);
  await evaluate(`document.querySelector('section[data-view="ledger"] [data-action="ledger-export"]').click()`);
  await sleep(400);
  await check('Ledger CSV export toasts', `document.querySelector('#toast-region').innerText.includes('Exported 48 postings')`, true);

  const chipsBefore = await evaluate(`document.querySelectorAll('#chat-messages > *').length`);
  await evaluate(`document.querySelector('#chat-chips button').click()`);
  await sleep(1800);
  await check('Chat chip triggers answer', `document.querySelectorAll('#chat-messages > *').length > ${chipsBefore}`, true);

  await sleep(300);
  await evaluate(`document.querySelector('#menu-button').click()`);
  await sleep(300);
  await check('Mobile sidebar opens', `!document.querySelector('#sidebar').classList.contains('-translate-x-full')`, true);
  await evaluate(`document.querySelector('#sidebar-overlay').click()`);
  await sleep(300);
  await check('Overlay closes sidebar', `document.querySelector('#sidebar').classList.contains('-translate-x-full')`, true);
  await send('Emulation.clearDeviceMetricsOverride');

  console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n- ${problems.join('\n- ')}` : '\nNo runtime errors captured.');
  ws.close();
  process.exit(problems.length ? 1 : 0);
}

main().catch((error) => {
  console.error('SMOKE FAILED:', error.message);
  process.exit(1);
});
