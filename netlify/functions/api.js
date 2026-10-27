'use strict';

/**
 * Serverless mirror of the Express API in `server.js`.
 * `/api/*` is rewritten here by `netlify.toml`, so the browser keeps using the
 * exact same relative URLs it uses against the local Express server.
 *
 * The demo dataset is generated in memory, so the only state that needs to
 * survive between invocations (last sync, sync events, trained patterns and the
 * training log) is snapshotted into Netlify Blobs. Without a Blobs context
 * (plain `node`, or local unit checks) it degrades to per-instance memory.
 */

const {
  LOCATIONS,
  getDashboard,
  getLedger,
  markExpected,
  resetTraining,
  getTrainingLog,
  forceSync,
  getLocation,
  snapshotState,
  hydrateState,
} = require('../../server/data');
const { answer } = require('../../server/assistant');

const STATE_STORE = 'mad-vervet-erp';
const STATE_KEY = 'demo-state';
const STATE_TTL_MS = 1500;

let storePromise = null;
let stateLoadedAt = 0;

function loadStore() {
  if (!storePromise) {
    storePromise = (async () => {
      try {
        const { getStore } = require('@netlify/blobs');
        return getStore({ name: STATE_STORE, consistency: 'strong' });
      } catch (error) {
        if (process.env.NETLIFY) {
          console.warn('[erp] State store unavailable, using in-memory state:', error.message);
        }
        return null;
      }
    })();
  }
  return storePromise;
}

async function pullState(store) {
  if (!store || Date.now() - stateLoadedAt < STATE_TTL_MS) return;
  stateLoadedAt = Date.now();
  try {
    const saved = await store.get(STATE_KEY, { type: 'json' });
    if (saved) hydrateState(saved);
  } catch (error) {
    /* First run or unlinked site: keep whatever this instance already holds. */
  }
}

async function pushState(store) {
  if (!store) return;
  stateLoadedAt = Date.now();
  try {
    await store.setJSON(STATE_KEY, snapshotState());
  } catch (error) {
    console.warn('[erp] Could not persist demo state:', error.message);
  }
}

function json(payload, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(payload),
  };
}

function resolveLocation(value) {
  return LOCATIONS.some((location) => location.id === value) ? value : 'global';
}

/** Handles both `/.netlify/functions/api/x` (bundled path) and `/api/x` (rewrite). */
function resolveRoutePath(event) {
  let fromUrl = '';
  try {
    fromUrl = new URL(event.rawUrl || '', 'http://localhost').pathname;
  } catch (error) {
    fromUrl = '';
  }
  const source = /^\/api(\/|$)/.test(fromUrl) ? fromUrl : event.path || fromUrl || '/';
  const stripped = String(source)
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api(?=\/|$)/, '')
    .replace(/\/{2,}/g, '/');
  const trimmed = stripped.replace(/(.)\/+$/, '$1');
  return trimmed || '/';
}

function resolveQuery(event) {
  if (event.queryStringParameters) return event.queryStringParameters;
  const params = {};
  try {
    new URL(event.rawUrl || '', 'http://localhost').searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch (error) {
    /* no query string */
  }
  return params;
}

function resolveBody(event) {
  if (!event.body) return { ok: true, value: {} };
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  try {
    const parsed = JSON.parse(raw);
    return { ok: true, value: parsed && typeof parsed === 'object' ? parsed : {} };
  } catch (error) {
    return { ok: false, value: {} };
  }
}

exports.handler = async (event = {}) => {
  const method = String(event.httpMethod || 'GET').toUpperCase();
  const routePath = resolveRoutePath(event);
  const query = resolveQuery(event);
  const store = await loadStore();
  await pullState(store);

  const locationId = resolveLocation(String(query.location || 'global'));

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: { allow: 'GET,POST,OPTIONS' }, body: '' };
  }

  try {
    if (method === 'GET' && routePath === '/locations') {
      return json({ locations: LOCATIONS });
    }

    if (method === 'GET' && routePath === '/dashboard') {
      return json(getDashboard(locationId));
    }

    if (method === 'GET' && routePath === '/ledger') {
      return json(getLedger(locationId));
    }

    if (method === 'GET' && routePath === '/training') {
      return json({ log: getTrainingLog() });
    }

    if (method === 'POST' && routePath === '/training/reset') {
      const result = resetTraining();
      await pushState(store);
      return json(result);
    }

    if (method === 'POST' && routePath === '/sync') {
      const result = forceSync();
      await pushState(store);
      return json(result);
    }

    if (method === 'POST' && routePath === '/assistant/query') {
      const { ok, value } = resolveBody(event);
      if (!ok) return json({ error: 'Invalid JSON body' }, 400);
      const message = String(value.message || '').slice(0, 500);
      if (!message.trim()) return json({ error: 'A message is required' }, 400);
      const location = getLocation(resolveLocation(String(value.location || 'global')));
      return json({ reply: answer(message, location.id), location: location.id });
    }

    const expectMatch = routePath.match(/^\/alerts\/([^/]+)\/expect$/);
    if (method === 'POST' && expectMatch) {
      const { ok, value } = resolveBody(event);
      if (!ok) return json({ error: 'Invalid JSON body' }, 400);
      const alertLocation = resolveLocation(String(value.location || 'global'));
      const reason = String(value.reason || 'Expected pattern');
      const result = markExpected(alertLocation, decodeURIComponent(expectMatch[1]), reason);
      if (!result) return json({ error: 'Alert not found for this location' }, 404);
      await pushState(store);
      return json(result);
    }

    return json({ error: 'Unknown API route' }, 404);
  } catch (error) {
    console.error('[erp]', error);
    return json({ error: 'Unexpected server error' }, 500);
  }
};
