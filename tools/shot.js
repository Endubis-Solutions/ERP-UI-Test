'use strict';

/**
 * Capture dashboard screenshots over the Chrome DevTools Protocol.
 * Usage: node tools/shot.js (requires Chrome on --remote-debugging-port=9222)
 */

const fs = require('fs');
const path = require('path');

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
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const shoot = async (name, width, height, script) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 700,
    });
    await sleep(400);
    if (script) {
      await send('Runtime.evaluate', { expression: script, awaitPromise: true });
      await sleep(600);
    }
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(__dirname, '..', `.shot-${name}.png`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    console.log('saved', file);
  };

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: APP });
  await sleep(2600);

  await shoot('desktop', 1440, 900);
  await shoot('drawer', 1440, 900, `document.querySelector('[data-alert-filter="all"]').click(); document.querySelector('#alerts-feed [data-action="investigate"]').click(); true`);
  await shoot('revenue', 1440, 900, `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); document.querySelector('#revenue-subnav [data-department="events"]').click(); true`);
  await shoot('ledger', 1440, 1000, `document.querySelector('.nav-item[data-view="ledger"]').click(); true`);
  await shoot('mobile', 390, 844);
  await shoot(
    'mobile-summary',
    390,
    1600,
    `document.querySelector('[data-view="summary"]:not(section)').click(); window.scrollTo(0, 0); true`,
  );
  await shoot('mobile-ledger', 390, 1200, `document.querySelector('.nav-item[data-view="ledger"]').click(); window.scrollTo(0, 0); true`);

  ws.close();
}

main().catch((error) => {
  console.error('SHOT FAILED:', error.message);
  process.exit(1);
});
