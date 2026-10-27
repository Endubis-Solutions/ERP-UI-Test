'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

const stripLiterals = (source) =>
  source
    .replace(/`(?:\\[\s\S]|[^`\\])*`/g, '``')
    .replace(/'(?:\\[\s\S]|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\[\s\S]|[^"\\\n])*"/g, '""')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const code = stripLiterals(app);

const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
const templateIds = new Set([...app.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map((match) => match[1]));
const appIds = [...app.matchAll(/\$\('#([A-Za-z0-9_-]+)'/g)].map((match) => match[1]);
const missingIds = [...new Set(appIds)].filter((id) => !htmlIds.has(id) && !templateIds.has(id));

const iconBlock = app.slice(app.indexOf('const ICON_PATHS'), app.indexOf('function icon('));
const iconKeys = new Set([...iconBlock.matchAll(/^\s{4}([a-z]+):/gm)].map((match) => match[1]));
const usedIcons = [...app.matchAll(/icon\('([a-z]+)'/g)].map((match) => match[1]);
const missingIcons = [...new Set(usedIcons)].filter((name) => !iconKeys.has(name));

const declared = new Set([...code.matchAll(/function\s+([A-Za-z0-9_$]+)\s*\(/g)].map((match) => match[1]));
const arrowFns = new Set([...code.matchAll(/const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(/g)].map((match) => match[1]));
const known = new Set([...declared, ...arrowFns]);

const keywords = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'new', 'await', 'delete', 'void', 'do',
]);
const builtins = new Set([
  'Number', 'String', 'Boolean', 'Array', 'Object', 'Math', 'Date', 'Intl', 'JSON', 'Map', 'Set', 'Error', 'Promise',
  'RegExp', 'Blob', 'URL', 'FormData', 'fetch', 'setTimeout', 'setInterval', 'clearInterval', 'clearTimeout',
  'requestAnimationFrame', 'queueMicrotask', 'encodeURIComponent', 'decodeURIComponent', 'parseInt', 'parseFloat',
  'isNaN', 'confirm', 'alert', 'console',
]);

const called = new Set([...code.matchAll(/(?<![.\w$])([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)].map((match) => match[1]));
const missingFns = [...called].filter((name) => !known.has(name) && !builtins.has(name) && !keywords.has(name));

const failures = missingIds.length + missingIcons.length + missingFns.length;

console.log(failures ? 'FAIL' : 'PASS', '· DOM + symbol contract');
console.log('  IDs referenced but not found (HTML or templates):', missingIds.length ? missingIds : 'none');
console.log('  Icons used but missing in ICON_PATHS:', missingIcons.length ? missingIcons : 'none');
console.log('  Called functions without a declaration:', missingFns.length ? missingFns : 'none');
console.log('  Functions declared:', known.size, '· DOM ids:', htmlIds.size, '· icon keys:', iconKeys.size);

process.exitCode = failures ? 1 : 0;
