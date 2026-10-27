'use strict';

const { getDashboard, getLocation, money, pct, numeric } = require('./data');

function clock(location) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: location.timezone,
  }).format(new Date());
}

function meta(location) {
  return `PMS ledger × POS · ${clock(location)} ${location.tzLabel} · live`;
}

function djEventReply() {
  return {
    intro:
      'Yes — the Nairobi DJ night operated at a profit. Here is the settlement reconciled against the ticketing export and the Sage vendor ledger.',
    table: {
      title: 'Nairobi DJ night · 26 Oct',
      columns: ['Line item', 'Amount'],
      rows: [
        { cells: ['Ticket sales (412 × KES 1,500)', '+KES 618,000'] },
        { cells: ['Outsourced sound & staging', '−KES 210,000'] },
        { cells: ['DJ fee & production', '−KES 120,000'] },
        { cells: ['Security, staff & permits', '−KES 48,600'] },
        { cells: ['Net profit', 'KES 239,400'], total: true },
      ],
      note: 'Sound invoice is 12% above the KES 187,500 quote with no PO — flagged as a medium discrepancy.',
    },
    verdict: {
      tone: 'positive',
      text: '38.7% net margin — 6.4 pts above the 32% events floor and the strongest event this quarter.',
    },
    chips: [
      'Show the sound invoice variance',
      'Compare to September events',
      'Explain the bar variance that night',
    ],
    meta: 'Ticketing × Sage · 26 Oct close',
  };
}

function marginReply(location) {
  const dashboard = getDashboard(location.id);
  const { departments, totals } = dashboard;
  const sorted = [...departments].sort((a, b) => b.net - a.net);
  const top = sorted[0];
  const weakest = [...departments].sort((a, b) => a.margin - b.margin)[0];
  const bestShare = Math.round((top.net / totals.net) * 100);

  return {
    intro: `${location.label} closed yesterday at a ${pct(totals.margin)} net margin — ${money(
      totals.net,
      location.currency,
    )} net on ${money(totals.gross, location.currency)} gross.`,
    table: {
      title: 'Net contribution by department',
      columns: ['Department', 'Net', 'Margin'],
      rows: sorted.map((department) => ({
        cells: [
          department.name,
          money(department.net, location.currency, { compact: true }),
          pct(department.margin),
        ],
      })),
      note: 'Logged expenses only. Pending receipts are excluded until reconciled.',
    },
    verdict: {
      tone: 'positive',
      text: `${top.name} contributed ${bestShare}% of net profit. ${weakest.name} is the thinnest stream at ${pct(
        weakest.margin,
      )} — worth a cost review.`,
    },
    chips: [
      'Which department is leaking the most?',
      'Show yesterday’s consolidated summary',
      'What changed vs the 7-day average?',
    ],
    meta: meta(location),
  };
}

function alertsReply(location) {
  const dashboard = getDashboard(location.id);
  const open = dashboard.alerts.filter((alert) => !alert.trained);
  const high = open.filter((alert) => alert.severity === 'high');
  const exposure = open.reduce((sum, alert) => sum + alert.impact.amount, 0);

  return {
    intro: `${open.length} flags are open for ${location.label}: ${high.length} high severity and ${
      open.length - high.length
    } medium. Combined value at risk is ${money(exposure, location.currency, { compact: true })}.`,
    table: {
      title: 'Open discrepancies',
      columns: ['Severity', 'Department', 'Impact'],
      rows: open.map((alert) => ({
        cells: [alert.severity === 'high' ? 'High' : 'Medium', alert.department, alert.impactLabel],
      })),
      note: 'Open any alert in the right rail to view the evidence pack.',
    },
    verdict: {
      tone: 'warning',
      text: high.length
        ? `${high[0].department} needs a decision first: ${high[0].title.toLowerCase()}.`
        : 'No high-severity items — medium flags can be reviewed before close.',
    },
    chips: [
      'Open the bar variance evidence',
      'Draft an action plan for the alerts',
      'How do we compare to last week?',
    ],
    meta: meta(location),
  };
}

function summaryReply(location) {
  const { totals, departments } = getDashboard(location.id);
  const sorted = [...departments].sort((a, b) => b.net - a.net);

  return {
    intro: `Yesterday, ${location.label} generated ${money(
      totals.gross,
      location.currency,
    )} gross with ${money(totals.expenses, location.currency)} in logged expenses — a ${pct(
      totals.margin,
    )} net margin.`,
    table: {
      title: 'Consolidated result · 26 Oct',
      columns: ['Line', 'Amount'],
      rows: [
        { cells: ['Gross income', money(totals.gross, location.currency)] },
        { cells: ['Logged expenses', `−${money(totals.expenses, location.currency)}`] },
        { cells: ['Net margin', money(totals.net, location.currency)], total: true },
        { cells: ['Margin', pct(totals.margin)] },
      ],
      note: 'Figures exclude pending receipt matches and unposted OTA commissions.',
    },
    verdict: {
      tone: 'positive',
      text: `${sorted[0].name} was the largest net contributor at ${money(
        sorted[0].net,
        location.currency,
        { compact: true },
      )}. ${sorted[sorted.length - 1].name} was the smallest.`,
    },
    chips: [
      'Break this down by department',
      'What should I review first?',
      'Show the AI morning brief',
    ],
    meta: meta(location),
  };
}

function syncReply(location) {
  return {
    intro:
      'The PMS connection is healthy. The last full aggregation completed 2 minutes ago with 18,240 records and no write conflicts.',
    table: {
      title: 'Sync coverage',
      columns: ['System', 'Records', 'Latency'],
      rows: [
        { cells: ['Opera Cloud', numeric(1284), '240 ms'] },
        { cells: ['Lightspeed POS', numeric(3412), '180 ms'] },
        { cells: ['MarketMan', numeric(986), '620 ms'] },
        { cells: ['Sage Intacct', numeric(214), '310 ms'] },
      ],
      note: 'MarketMan is the only delayed feed — two count sheets are pending review.',
    },
    verdict: {
      tone: 'warning',
      text: 'Acknowledge the two pending stock count sheets so the Bar variance can auto-reconcile tonight.',
    },
    chips: ['Open PMS sync status', 'Why is MarketMan delayed?', 'Force a full sync'],
    meta: meta(location),
  };
}

function fallbackReply(location) {
  const { totals } = getDashboard(location.id);
  return {
    intro: `I can work across ${location.label}’s PMS ledger, POS, inventory and expense data. Yesterday closed at ${pct(
      totals.margin,
    )} net margin on ${money(totals.gross, location.currency, { compact: true })} gross.`,
    table: null,
    verdict: null,
    chips: [
      'Summarise yesterday for me',
      'Which margins are weakest?',
      'List open discrepancies',
    ],
    meta: meta(location),
  };
}

function answer(message, locationId = 'global') {
  const text = String(message || '').toLowerCase();
  const location = getLocation(locationId);

  if (/nairobi/.test(text) && /(dj|event|party|ticket|sound)/.test(text)) {
    return djEventReply();
  }
  if (/(margin|profit|net)/.test(text)) {
    return marginReply(location);
  }
  if (/(discrepan|alert|flag|variance|short|leak)/.test(text)) {
    return alertsReply(location);
  }
  if (/(sync|pms|refresh|feed)/.test(text)) {
    return syncReply(location);
  }
  if (/(summar|brief|yesterday|performance|revenue|close)/.test(text)) {
    return summaryReply(location);
  }
  return fallbackReply(location);
}

module.exports = { answer };
