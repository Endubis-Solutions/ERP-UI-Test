'use strict';

/**
 * Local harness for the Netlify function: builds synthetic Lambda-style events
 * and exercises every route so `netlify deploy` cannot surprise us.
 * Run: npm run test:fn
 */

const handler = require('../netlify/functions/api').handler;

let passed = 0;
const failures = [];

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`PASS · ${label}${detail === undefined ? '' : ` -> ${detail}`}`);
  } else {
    failures.push(`${label}${detail === undefined ? '' : ` -> ${detail}`}`);
    console.log(`FAIL · ${label}${detail === undefined ? '' : ` -> ${detail}`}`);
  }
}

function buildEvent(routePath, options = {}) {
  const { method = 'GET', query = {}, body } = options;
  const pairs = Object.entries(query).map(([key, value]) => [key, String(value)]);
  const search = pairs.length ? `?${new URLSearchParams(pairs).toString()}` : '';
  return {
    httpMethod: method,
    path: `/.netlify/functions/api${routePath}`,
    rawUrl: `https://mad-vervet.netlify.app/api${routePath}${search}`,
    queryStringParameters: pairs.length ? Object.fromEntries(pairs) : null,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body),
    isBase64Encoded: false,
  };
}

async function call(routePath, options = {}) {
  const response = await handler(buildEvent(routePath, options));
  let json = null;
  try {
    json = JSON.parse(response.body);
  } catch (error) {
    json = null;
  }
  return { status: response.statusCode, headers: response.headers || {}, json };
}

(async () => {
  const locations = await call('/locations');
  check('GET /locations -> 200', locations.status === 200);
  check('GET /locations -> 3 contexts', locations.json?.locations?.length === 3, locations.json?.locations?.length);
  check(
    'GET /locations -> ids',
    ['global', 'addis', 'nairobi'].every((id) => locations.json?.locations?.some((l) => l.id === id)),
  );

  const dashboard = await call('/dashboard', { query: { location: 'global' } });
  check('GET /dashboard -> 200', dashboard.status === 200);
  check('GET /dashboard -> currency USD', dashboard.json?.currency === 'USD', dashboard.json?.currency);
  check('GET /dashboard -> totals present', Number(dashboard.json?.totals?.gross) > 0, dashboard.json?.totals?.gross);

  const fallback = await call('/dashboard', { query: { location: 'bogus' } });
  check('GET /dashboard?location=bogus -> global', fallback.json?.location?.id === 'global');

  const ledger = await call('/ledger', { query: { location: 'global' } });
  check('GET /ledger -> 200', ledger.status === 200);
  check('GET /ledger -> 48 postings', ledger.json?.rows?.length === 48, ledger.json?.rows?.length);
  check('GET /ledger -> balanced', ledger.json?.reconciliation?.balanced === true);
  check(
    'GET /ledger -> revenue ties to dashboard',
    ledger.json?.totals?.revenue === dashboard.json?.totals?.gross,
    `${ledger.json?.totals?.revenue} vs ${dashboard.json?.totals?.gross}`,
  );
  check('GET /ledger -> expenses tie to dashboard', ledger.json?.totals?.expenses === dashboard.json?.totals?.expenses);

  const addisLedger = await call('/ledger', { query: { location: 'addis' } });
  const addisDashboard = await call('/dashboard', { query: { location: 'addis' } });
  check('GET /ledger?location=addis -> ETB', addisLedger.json?.currency === 'ETB', addisLedger.json?.currency);
  check('GET /ledger?location=addis -> balanced', addisLedger.json?.reconciliation?.balanced === true);
  check(
    'GET /ledger?location=addis -> ties to dashboard',
    addisLedger.json?.totals?.revenue === addisDashboard.json?.totals?.gross,
  );

  const nairobiLedger = await call('/ledger', { query: { location: 'nairobi' } });
  check('GET /ledger?location=nairobi -> balanced', nairobiLedger.json?.reconciliation?.balanced === true);

  const alertId = dashboard.json?.alerts?.[0]?.id;
  check('dashboard exposes alert ids', Boolean(alertId), alertId);
  const train = await call(`/alerts/${encodeURIComponent(alertId || 'missing')}/expect`, {
    method: 'POST',
    body: { location: 'global', reason: 'Known promo rate' },
  });
  check('POST /alerts/:id/expect -> 200', train.status === 200);
  check('POST /alerts/:id/expect -> trained', train.json?.trained === true);
  const afterTrain = await call('/dashboard', { query: { location: 'global' } });
  check(
    'trained patterns visible on next dashboard',
    afterTrain.json?.sync?.trainedPatterns >= 1,
    afterTrain.json?.sync?.trainedPatterns,
  );
  check(
    'alert flagged as trained',
    afterTrain.json?.alerts?.some((alert) => alert.id === alertId && alert.trained === true),
  );

  const expectMissing = await call('/alerts/nope/expect', { method: 'POST', body: {} });
  check('POST /alerts/nope/expect -> 404', expectMissing.status === 404);

  const training = await call('/training');
  check(
    'GET /training -> log entry',
    Array.isArray(training.json?.log) && training.json.log.length >= 1,
    training.json?.log?.length,
  );

  const reset = await call('/training/reset', { method: 'POST' });
  check('POST /training/reset -> 200', reset.status === 200 && reset.json?.trainedPatterns === 0);
  const afterReset = await call('/training');
  check('training log cleared', Array.isArray(afterReset.json?.log) && afterReset.json.log.length === 0);

  const sync = await call('/sync', { method: 'POST', body: { location: 'nairobi' } });
  check('POST /sync -> 200', sync.status === 200 && sync.json?.ok === true);
  const afterSync = await call('/dashboard', { query: { location: 'global' } });
  check('sync timestamp persisted', afterSync.json?.sync?.lastSync === sync.json?.lastSync, afterSync.json?.sync?.lastSync);
  check('sync event recorded', afterSync.json?.sync?.events?.[0]?.label === 'Manual force sync completed');

  const chat = await call('/assistant/query', {
    method: 'POST',
    body: { message: 'How is revenue today?', location: 'addis' },
  });
  check(
    'POST /assistant/query -> reply',
    chat.status === 200 &&
      typeof chat.json?.reply === 'object' &&
      typeof chat.json.reply.intro === 'string' &&
      chat.json.reply.intro.length > 20,
  );
  check('POST /assistant/query -> location echoed', chat.json?.location === 'addis');

  const emptyChat = await call('/assistant/query', { method: 'POST', body: { message: '   ' } });
  check('POST /assistant/query empty -> 400', emptyChat.status === 400);
  const badJson = await call('/assistant/query', { method: 'POST', body: '{oops' });
  check('POST /assistant/query bad JSON -> 400', badJson.status === 400);

  const unknown = await call('/nope');
  check('GET /nope -> 404', unknown.status === 404 && unknown.json?.error === 'Unknown API route');
  const wrongMethod = await call('/dashboard', { method: 'DELETE' });
  check('DELETE /dashboard -> 404', wrongMethod.status === 404);

  const options = await call('/ledger', { method: 'OPTIONS' });
  check('OPTIONS -> 204', options.status === 204);

  const noQueryObject = await handler({
    httpMethod: 'GET',
    path: '/.netlify/functions/api/dashboard',
    rawUrl: 'https://mad-vervet.netlify.app/api/dashboard?location=nairobi',
    headers: {},
    body: null,
    isBase64Encoded: false,
  });
  const noQueryJson = JSON.parse(noQueryObject.body);
  check('query parsed from rawUrl when map missing', noQueryJson?.location?.id === 'nairobi', noQueryJson?.location?.id);

  const headers = await call('/locations');
  check(
    'responses are JSON + no-store',
    /application\/json/.test(headers.headers['content-type'] || '') && headers.headers['cache-control'] === 'no-store',
  );

  // State snapshot/hydrate is what replaces the Express process memory on Netlify.
  const data = require('../server/data');
  await call(`/alerts/${encodeURIComponent(alertId || 'missing')}/expect`, { method: 'POST', body: {} });
  const snapshot = data.snapshotState();
  data.resetTraining();
  check('reset clears training log before restore', data.getTrainingLog().length === 0);
  const restored = data.hydrateState({ ...snapshot, updatedAt: snapshot.updatedAt + 1000 });
  check('hydrateState restores newer snapshot', restored === true && data.getTrainingLog().length >= 1, data.getTrainingLog().length);
  const stale = data.hydrateState({ ...snapshot, updatedAt: 1 });
  check('hydrateState ignores stale snapshot', stale === false);
  check('snapshot survives JSON round-trip', JSON.parse(JSON.stringify(snapshot)).trainedPatterns.length >= 1);

  console.log('');
  if (failures.length) {
    console.log(`${failures.length} failing check(s):`);
    failures.forEach((failure) => console.log(`  - ${failure}`));
    process.exitCode = 1;
    return;
  }
  console.log(`All ${passed} function checks passed.`);
})();
