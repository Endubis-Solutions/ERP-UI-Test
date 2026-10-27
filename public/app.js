'use strict';

/**
 * Mad Vervet executive console — client renderer.
 * Single source of truth: GET /api/dashboard (mocked PMS aggregation).
 */
(() => {
  const state = {
    dashboard: null,
    location: 'global',
    view: 'summary',
    department: 'rooms',
    alertFilter: 'all',
    searchCursor: 0,
    searchResults: [],
    searchIndex: [],
    openAlert: null,
    drawerReturnFocus: null,
    settings: null,
    trainingLog: [],
    chat: [],
    chatOpen: false,
    busy: false,
    ledger: null,
    ledgerLoading: false,
    ledgerFilters: { department: 'all', category: 'all', source: 'all', status: 'all', direction: 'all', query: '' },
    ledgerSort: { key: 'time', dir: 'desc' },
    ledgerPage: 1,
    ledgerPageSize: 25,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const ACCENTS = {
    sky: { text: 'text-sky-300', bg: 'bg-sky-500/10', ring: 'ring-sky-400/20', bar: 'bg-sky-400', hex: '#38bdf8' },
    amber: { text: 'text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-400/20', bar: 'bg-amber-400', hex: '#fbbf24' },
    orange: { text: 'text-orange-300', bg: 'bg-orange-500/10', ring: 'ring-orange-400/20', bar: 'bg-orange-400', hex: '#fb923c' },
    violet: { text: 'text-violet-300', bg: 'bg-violet-500/10', ring: 'ring-violet-400/20', bar: 'bg-violet-400', hex: '#a78bfa' },
    cyan: { text: 'text-cyan-300', bg: 'bg-cyan-500/10', ring: 'ring-cyan-400/20', bar: 'bg-cyan-400', hex: '#22d3ee' },
    emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-400/20', bar: 'bg-emerald-400', hex: '#34d399' },
  };

  const SEVERITY = {
    high: {
      label: 'High',
      chip: 'bg-rose-500/15 text-rose-300',
      border: 'border-rose-500/25',
      card: 'from-rose-500/[0.09]',
      dot: 'bg-rose-400',
      text: 'text-rose-300',
      hex: '#fb7185',
    },
    medium: {
      label: 'Medium',
      chip: 'bg-amber-500/15 text-amber-300',
      border: 'border-amber-500/25',
      card: 'from-amber-500/[0.08]',
      dot: 'bg-amber-400',
      text: 'text-amber-300',
      hex: '#fbbf24',
    },
    low: {
      label: 'Low',
      chip: 'bg-slate-500/20 text-slate-300',
      border: 'border-white/10',
      card: 'from-slate-500/[0.06]',
      dot: 'bg-slate-400',
      text: 'text-slate-300',
      hex: '#94a3b8',
    },
  };

  const ICON_PATHS = {
    bed: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 18h18M3 18v2m18-2v2M7 9V6.5A1.5 1.5 0 0 1 8.5 5h7A1.5 1.5 0 0 1 17 6.5V9" stroke-linecap="round"/>',
    wine: '<path d="M8 4h8l-.7 6.2A3.5 3.5 0 0 1 12 13.5a3.5 3.5 0 0 1-3.3-3.3L8 4ZM12 13.5V20m-3 0h6" stroke-linecap="round" stroke-linejoin="round"/>',
    utensils: '<path d="M7 3v7m0 0a2 2 0 0 0 2-2V3M7 10a2 2 0 0 1-2-2V3m2 7v11M17 3c-1.7 1-2.5 2.6-2.5 4.5S15 11 17 11v10" stroke-linecap="round" stroke-linejoin="round"/>',
    sparkles: '<path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3ZM18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z" stroke-linejoin="round"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" stroke-linejoin="round"/>',
    shirt: '<path d="M8 4 5 6l-2 4 3 2v8h12v-8l3-2-2-4-3-2-2 2h-4L8 4Z" stroke-linejoin="round"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18" stroke-linecap="round"/>',
    receipt: '<path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Z" stroke-linejoin="round"/><path d="M9 8h6M9 12h6" stroke-linecap="round"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke-linejoin="round"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9" stroke-linejoin="round"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" stroke-linejoin="round"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" stroke-linejoin="round"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3m0 8v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" stroke-linecap="round"/>',
    alert: '<path d="M12 4 3 20h18L12 4Z" stroke-linejoin="round"/><path d="M12 10v4m0 3v.5" stroke-linecap="round"/>',
    check: '<path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V6l-8-3Z" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke-linecap="round" stroke-linejoin="round"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-.6 4M20 5v6h-6" stroke-linecap="round" stroke-linejoin="round"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2" stroke-linecap="round"/>',
    send: '<path d="M4 12 20 4l-4 16-4-6-8-2Z" stroke-linecap="round" stroke-linejoin="round"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a2 2 0 0 0-2 2v8.5A2.5 2.5 0 0 0 6.5 16" stroke-linecap="round"/>',
    close: '<path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.3 20a2 2 0 0 0 3.4 0" stroke-linecap="round"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/>',
    bulb: '<path d="M9 18h6m-5 3h4M12 3a6 6 0 0 1 3.5 10.9c-.6.5-.9 1.2-.9 2H9.4c0-.8-.3-1.5-.9-2A6 6 0 0 1 12 3Z" stroke-linecap="round" stroke-linejoin="round"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M15 10v10" stroke-linecap="round"/>',
  };

  function icon(name, className = 'h-4 w-4') {
    const paths = ICON_PATHS[name] || ICON_PATHS.sparkles;
    return `<svg viewBox="0 0 24 24" class="${className}" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">${paths}</svg>`;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[char];
    });
  }

  function money(amount, options = {}) {
    const currency = state.dashboard?.currency || 'USD';
    const abs = Math.abs(Number(amount) || 0);
    const compact = options.compact === true || (options.compact === 'auto' && abs >= 1000000);
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 0,
    });
    const formatted = formatter.format(abs);
    if (options.signed) return `${amount < 0 ? '−' : '+'}${formatted}`;
    return amount < 0 ? `−${formatted}` : formatted;
  }

  function pct(value) {
    return `${Number(value).toFixed(1)}%`;
  }

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
  }

  function relativeTime(iso) {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function dayLabel(date, withYear = false) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
    }).format(date);
  }

  function sparkline(trend, accent, key) {
    const width = 132;
    const height = 40;
    const pad = 3;
    const palette = ACCENTS[accent] || ACCENTS.emerald;
    const max = Math.max(...trend);
    const min = Math.min(...trend);
    const span = max - min || 1;
    const points = trend.map((value, index) => {
      const x = pad + (index * (width - pad * 2)) / (trend.length - 1);
      const y = height - pad - ((value - min) / span) * (height - pad * 2);
      return [x, y];
    });
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ');
    const area = `${line} L${width - pad} ${height} L${pad} ${height} Z`;
    const last = points[points.length - 1];
    const gradient = `spark-${key}`;
    return `<svg viewBox="0 0 ${width} ${height}" class="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.hex}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="${palette.hex}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#${gradient})"/>
      <path d="${line}" fill="none" stroke="${palette.hex}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.2" fill="${palette.hex}"/>
    </svg>`;
  }

  const VIEW_META = {
    summary: { title: 'Executive Summary', label: 'Summary' },
    revenue: { title: 'Revenue Streams', label: 'Revenue' },
    ledger: { title: 'Finance Ledger', label: 'Ledger' },
    sync: { title: 'PMS Sync Status', label: 'Sync' },
    settings: { title: 'AI Settings', label: 'AI settings' },
  };

  async function api(path, options = {}) {
    const response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Request failed (${response.status})`);
    }
    return response.json();
  }

  function toast(message, tone = 'success') {
    const region = $('#toast-region');
    if (!region) return;
    const tones = {
      success: 'border-emerald-400/30 bg-emerald-500/[0.12] text-emerald-100',
      error: 'border-rose-400/30 bg-rose-500/[0.12] text-rose-100',
      info: 'border-white/10 bg-slate-800/95 text-gray-200',
    };
    const node = document.createElement('div');
    node.className = `pointer-events-auto flex w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] shadow-2xl shadow-black/50 backdrop-blur-md animate-fade-up ${
      tones[tone] || tones.info
    }`;
    node.setAttribute('role', 'status');
    node.innerHTML = `${icon(tone === 'error' ? 'alert' : 'check', 'h-4 w-4 shrink-0')}<span class="flex-1">${esc(message)}</span>`;
    region.appendChild(node);
    window.setTimeout(() => {
      node.style.transition = 'opacity 240ms ease, transform 240ms ease';
      node.style.opacity = '0';
      node.style.transform = 'translateY(-6px)';
      window.setTimeout(() => node.remove(), 260);
    }, 3800);
  }

  function yesterday() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  }

  function updateClock() {
    const location = state.dashboard?.location;
    const timeZone = location?.timezone || 'Africa/Addis_Ababa';
    const now = new Date();
    const date = $('#header-date');
    const clock = $('#header-clock');
    if (date) {
      date.textContent = new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone,
      }).format(now);
    }
    if (clock) {
      clock.textContent = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone,
      }).format(now);
    }
    const zone = $('#header-tz');
    if (zone) zone.textContent = location?.tzLabel || 'EAT';
  }

  function timeLabel(iso, withZone = false) {
    const location = state.dashboard?.location;
    const timeZone = location?.timezone || 'Africa/Addis_Ababa';
    const formatted = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(new Date(iso));
    return withZone && location ? `${formatted} ${location.tzLabel}` : formatted;
  }

  function renderSyncStamps() {
    const label = state.dashboard ? relativeTime(state.dashboard.sync.lastSync) : '—';
    $$('#sync-relative, [data-sync-relative]').forEach((node) => {
      node.textContent = label;
    });
  }

  function renderLocationContext() {
    const { location, locations } = state.dashboard;
    $('#location-label').textContent = location.label;
    $('#location-region').textContent = location.region;
    $('#location-menu').innerHTML = locations
      .map((item) => {
        const active = item.id === location.id;
        return `<button type="button" role="option" aria-selected="${active}" data-location="${item.id}"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition ${
            active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
          }">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
            active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/60 text-slate-400'
          }">${icon(item.id === 'global' ? 'globe' : 'shield', 'h-3.5 w-3.5')}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[12px] font-medium ${active ? 'text-white' : 'text-gray-300'}">${esc(item.label)}</span>
            <span class="block truncate text-[10px] text-slate-500">${esc(item.region)} · ${item.currency}</span>
          </span>
          ${active ? `<span class="text-emerald-300">${icon('check', 'h-3.5 w-3.5')}</span>` : ''}
        </button>`;
      })
      .join('');

    $('#period-label').textContent = dayLabel(yesterday(), true);
    $('#range-label').textContent = `Yesterday · ${dayLabel(yesterday())}`;
    $('#property-label').textContent = location.id === 'global' ? '3 properties' : '1 property';
    $('#ai-pattern-count').textContent = String(24 + state.dashboard.sync.trainedPatterns);
    updateClock();
    renderSyncStamps();
  }

  function closeSidebar() {
    const sidebar = $('#sidebar');
    const overlay = $('#sidebar-overlay');
    const button = $('#menu-button');
    if (!sidebar) return;
    sidebar.classList.remove('translate-x-0');
    sidebar.classList.add('-translate-x-full');
    overlay?.classList.add('hidden');
    button?.setAttribute('aria-expanded', 'false');
    const drawer = $('#alert-drawer');
    if (!drawer || drawer.classList.contains('hidden')) document.body.style.overflow = '';
  }

  function setView(view, options = {}) {
    if (!VIEW_META[view]) return;
    state.view = view;
    if (options.department) state.department = options.department;

    $$('#main-content > section[data-view]').forEach((section) => {
      const active = section.dataset.view === view;
      section.classList.toggle('hidden', !active);
      if (active) {
        section.classList.remove('animate-fade-up');
        void section.offsetWidth;
        section.classList.add('animate-fade-up');
      }
    });

    $$('.nav-item[data-view]').forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle('nav-item-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    $$('#revenue-subnav [data-view]').forEach((button) => {
      const active = view === 'revenue' && button.dataset.department === state.department;
      button.classList.toggle('bg-white/[0.06]', active);
      button.classList.toggle('text-gray-100', active);
      button.classList.toggle('text-slate-500', !active);
    });

    const revenueToggle = $('#revenue-toggle');
    if (revenueToggle) {
      const active = view === 'revenue';
      revenueToggle.classList.toggle('nav-item-active', active);
      if (active) revenueToggle.setAttribute('aria-current', 'page');
      else revenueToggle.removeAttribute('aria-current');
      if (active) toggleRevenueNav(true);
    }

    const grid = $('#content-grid');
    const rail = $('#right-rail');
    const wide = view === 'ledger';
    if (grid) {
      grid.classList.toggle('xl:grid-cols-[minmax(0,1fr)_356px]', !wide);
      grid.classList.toggle('xl:grid-cols-1', wide);
    }
    if (rail) rail.classList.toggle('hidden', wide);

    if (view === 'revenue') renderRevenue();
    if (view === 'ledger') loadLedger();
    if (view === 'sync') renderSync();
    if (view === 'settings') loadSettings();

    document.title = `${VIEW_META[view].title} · Mad Vervet Hostels`;
    closeSidebar();
    if (options.scroll !== false) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderSegment(segment) {
    const text = esc(segment.text);
    if (!segment.action) {
      if (segment.tone === 'stat') return `<strong class="font-semibold text-white tabular">${text}</strong>`;
      if (segment.tone === 'danger') return `<span class="text-rose-300">${text}</span>`;
      if (segment.tone === 'warn') return `<span class="text-amber-200">${text}</span>`;
      return text;
    }
    if (segment.action.type === 'alert') {
      const tone = segment.tone === 'danger' ? 'brief-link-danger' : 'brief-link-warn';
      return `<button type="button" class="brief-link ${tone}" data-alert-id="${esc(segment.action.id)}">${text}</button>`;
    }
    return `<button type="button" class="brief-link brief-link-accent" data-view="revenue" data-department="${esc(
      segment.action.department || 'rooms',
    )}">${text}</button>`;
  }

  function renderBrief() {
    const slot = $('#brief-slot');
    const { brief, location } = state.dashboard;
    const signalTone = { positive: 'text-emerald-300', negative: 'text-rose-300', neutral: 'text-gray-200' };
    const confidence = brief.confidence >= 90 ? 'High confidence' : brief.confidence >= 75 ? 'Medium confidence' : 'Low confidence';

    slot.innerHTML = `<article class="card relative overflow-hidden">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"></div>
      <div class="flex flex-wrap items-start gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
          ${icon('sparkles', 'h-[18px] w-[18px]')}
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-sm font-semibold text-white">AI morning brief</h2>
            <span class="chip bg-emerald-500/10 text-emerald-300">${esc(confidence)}</span>
          </div>
          <p class="mt-0.5 text-[11px] text-slate-500">
            Generated ${esc(brief.generatedAt)} · ${esc(location.label)} · reads PMS, POS, inventory &amp; ledger
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
          <button type="button" class="btn !px-2.5 !py-1.5 text-[11px]" data-action="brief-copy">
            ${icon('copy', 'h-3.5 w-3.5')}<span class="hidden sm:inline">Copy</span>
          </button>
          <button type="button" class="btn !px-2.5 !py-1.5 text-[11px]" data-action="brief-refresh">
            ${icon('refresh', 'h-3.5 w-3.5')}<span class="hidden sm:inline">Regenerate</span>
          </button>
        </div>
      </div>
      <div class="px-4 py-4 sm:px-5">
        <p class="text-[13.5px] leading-[1.8] text-slate-300">${brief.segments.map(renderSegment).join('')}</p>
        <div class="mt-4 grid gap-2 sm:grid-cols-3">
          ${brief.signals
            .map(
              (signal) => `<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <p class="text-[10px] uppercase tracking-[0.12em] text-slate-500">${esc(signal.label)}</p>
                <div class="mt-1 flex items-baseline gap-1.5">
                  <span class="text-[15px] font-semibold ${signalTone[signal.tone] || signalTone.neutral} tabular">${esc(signal.value)}</span>
                  <span class="truncate text-[10px] text-slate-500">${esc(signal.note)}</span>
                </div>
              </div>`,
            )
            .join('')}
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.015] px-4 py-2.5 sm:px-5">
        <p class="text-[10.5px] text-slate-500">Signals ranked by revenue impact · model verve-fin-v3</p>
        <button type="button" class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 transition hover:text-emerald-200" data-action="ask-brief">
          Ask a follow-up ${icon('arrow', 'h-3 w-3')}
        </button>
      </div>
    </article>`;
  }

  function marginTone(margin) {
    if (margin >= 60) return { bar: 'bg-emerald-400', text: 'text-emerald-300' };
    if (margin >= 45) return { bar: 'bg-amber-400', text: 'text-amber-300' };
    return { bar: 'bg-rose-400', text: 'text-rose-300' };
  }

  function renderKpis() {
    const { departments, totals } = state.dashboard;
    const weightedDelta = totals.gross
      ? departments.reduce((sum, department) => sum + department.gross * department.delta, 0) / totals.gross
      : 0;

    $('#kpi-summary').innerHTML = `
      <span class="text-slate-500">Gross <span class="font-semibold text-gray-200 tabular">${money(totals.gross, { compact: 'auto' })}</span></span>
      <span class="text-slate-500">Expenses <span class="font-semibold text-gray-200 tabular">${money(totals.expenses, { compact: 'auto' })}</span></span>
      <span class="text-slate-500">Net <span class="font-semibold text-emerald-300 tabular">${money(totals.net, { compact: 'auto' })}</span></span>
      <span class="chip ${
        weightedDelta >= 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
      }">${weightedDelta >= 0 ? '+' : ''}${weightedDelta.toFixed(1)}% WoW</span>`;

    $('#kpi-grid').innerHTML = departments
      .map((department) => {
        const accent = ACCENTS[department.accent] || ACCENTS.emerald;
        const tone = marginTone(department.margin);
        const positive = department.delta >= 0;
        return `<article class="card group relative overflow-hidden p-4 transition duration-200 hover:border-white/15 hover:bg-slate-800/80">
          <div class="flex items-start gap-2.5">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.bg} ${accent.text} ring-1 ring-inset ${accent.ring}">
              ${icon(department.icon, 'h-[18px] w-[18px]')}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13px] font-semibold text-white">${esc(department.name)}</p>
              <p class="truncate text-[11px] text-slate-500">${esc(department.meta)}</p>
            </div>
            <span class="chip shrink-0 ${positive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}">
              ${positive ? '▲' : '▼'} ${Math.abs(department.delta).toFixed(1)}%
            </span>
          </div>
          <div class="mt-3.5 flex items-end justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-[0.12em] text-slate-500">Net</p>
              <p class="mt-0.5 truncate text-xl font-semibold tracking-tight text-white tabular">${money(department.net, {
                compact: 'auto',
              })}</p>
            </div>
            <div class="h-9 w-[96px] shrink-0 opacity-90">${sparkline(department.trend, department.accent, `${state.location}-${department.id}`)}</div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div class="rounded-lg bg-white/[0.03] px-2 py-1.5">
              <span class="text-slate-500">Gross</span>
              <span class="block truncate font-medium text-gray-200 tabular">${money(department.gross, { compact: 'auto' })}</span>
            </div>
            <div class="rounded-lg bg-white/[0.03] px-2 py-1.5">
              <span class="text-slate-500">Expenses</span>
              <span class="block truncate font-medium text-gray-200 tabular">${money(department.expenses, { compact: 'auto' })}</span>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <div class="h-1 flex-1 overflow-hidden rounded-full bg-slate-700/60">
              <div class="h-full rounded-full ${tone.bar}" style="width:${clamp(department.margin)}%"></div>
            </div>
            <span class="text-[11px] font-medium ${tone.text} tabular">${pct(department.margin)}</span>
          </div>
          <button type="button" class="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            data-view="revenue" data-department="${esc(department.id)}" aria-label="Open ${esc(department.name)} revenue detail"></button>
          <span class="pointer-events-none absolute bottom-3 right-3 hidden text-[10px] text-slate-500 group-hover:block">Open ${icon('arrow', 'inline h-3 w-3')}</span>
        </article>`;
      })
      .join('');
  }

  function renderHealth() {
    const { health } = state.dashboard;
    const positiveBand = health.band === 'Excellent' || health.band === 'Healthy';
    const bandTone = positiveBand
      ? 'bg-emerald-500/10 text-emerald-300'
      : health.band === 'Watch'
        ? 'bg-amber-500/10 text-amber-300'
        : 'bg-rose-500/10 text-rose-300';
    const ringColor = health.score >= 80 ? '#34d399' : health.score >= 65 ? '#fbbf24' : '#fb7185';
    const circumference = 2 * Math.PI * 15.5;
    const dash = (clamp(health.score) / 100) * circumference;
    const deltaTone = health.scoreDelta >= 0 ? 'text-emerald-300' : 'text-rose-300';

    $('#health-slot').innerHTML = `<article class="card p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-white">Financial health</h2>
          <p class="mt-0.5 truncate text-[11px] text-slate-500">${esc(health.note)}</p>
        </div>
        <span class="chip shrink-0 ${bandTone}">${esc(health.band)}</span>
      </div>
      <div class="mt-4 flex items-center gap-4">
        <div class="relative h-[74px] w-[74px] shrink-0">
          <svg viewBox="0 0 36 36" class="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(148,163,184,0.16)" stroke-width="3.4"/>
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="${ringColor}" stroke-width="3.4" stroke-linecap="round"
              stroke-dasharray="${dash.toFixed(2)} ${circumference.toFixed(2)}"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-lg font-semibold leading-none text-white tabular">${health.score}</span>
            <span class="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">score</span>
          </div>
        </div>
        <dl class="min-w-0 flex-1 space-y-2 text-[11px]">
          <div class="flex items-center justify-between gap-2">
            <dt class="text-slate-500">Cash position</dt>
            <dd class="truncate font-medium text-gray-200 tabular">${money(health.cash, { compact: 'auto' })}</dd>
          </div>
          <div class="flex items-center justify-between gap-2">
            <dt class="text-slate-500">Expense ratio</dt>
            <dd class="font-medium text-gray-200 tabular">${pct(health.expenseRatio)}</dd>
          </div>
          <div class="flex items-center justify-between gap-2">
            <dt class="text-slate-500">Open flags</dt>
            <dd class="font-medium tabular ${health.openFlags > 2 ? 'text-rose-300' : 'text-gray-200'}">${health.openFlags}</dd>
          </div>
        </dl>
      </div>
      <div class="mt-3 flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-[11px]">
        <span class="text-slate-500">vs last week
          <span class="font-medium ${deltaTone} tabular">${health.scoreDelta >= 0 ? '+' : ''}${health.scoreDelta} pts</span>
        </span>
        <button type="button" class="inline-flex items-center gap-1 font-medium text-emerald-300 transition hover:text-emerald-200" data-view="sync">
          Sync health ${icon('arrow', 'h-3 w-3')}
        </button>
      </div>
    </article>`;
  }

  function renderAlertCard(alert) {
    if (alert.trained) {
      return `<article class="alert-card border border-emerald-400/15 bg-slate-800/40 opacity-80">
        <div class="flex items-center gap-2">
          <span class="chip bg-emerald-500/10 text-emerald-300">Expected</span>
          <span class="chip bg-white/[0.04] text-slate-400">${esc(alert.department)}</span>
          <span class="ml-auto text-[10px] text-slate-500 tabular">${esc(alert.detectedAt)}</span>
        </div>
        <h3 class="mt-2 text-[12.5px] font-medium leading-snug text-slate-300">${esc(alert.title)}</h3>
        <p class="mt-1.5 flex items-center gap-1 text-[10.5px] text-emerald-300/80">
          ${icon('check', 'h-3 w-3')} AI trained · excluded from the open flag count
        </p>
      </article>`;
    }

    const severity = SEVERITY[alert.severity] || SEVERITY.low;
    return `<article class="alert-card border ${severity.border} bg-gradient-to-br ${severity.card} to-slate-800/70 hover:border-white/20 hover:shadow-lift">
      <div class="flex items-center gap-2">
        <span class="chip ${severity.chip}">${severity.label}</span>
        <span class="chip bg-white/[0.04] text-slate-400">${esc(alert.department)}</span>
        <span class="ml-auto flex items-center gap-1 text-[10px] text-slate-500 tabular">
          ${icon('clock', 'h-3 w-3')} ${esc(alert.detectedAt)} · ${alert.confidence}%
        </span>
      </div>
      <h3 class="mt-2 text-[13px] font-semibold leading-snug text-white">${esc(alert.title)}</h3>
      <p class="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-slate-400">${esc(alert.summary)}</p>
      <div class="mt-2.5 flex items-center justify-between gap-2 rounded-lg bg-slate-900/40 px-2.5 py-1.5">
        <span class="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">${esc(alert.impact.label)}</span>
        <span class="text-xs font-semibold ${severity.text} tabular">${money(alert.impact.amount, { compact: 'auto' })}</span>
      </div>
      <div class="mt-3 flex items-center gap-1.5">
        <button type="button" class="btn flex-1 !px-2.5 !py-1.5 text-[11px]" data-action="investigate" data-alert-id="${esc(alert.id)}">
          Investigate
        </button>
        <button type="button" class="btn !px-2.5 !py-1.5 text-[11px]" data-action="train" data-alert-id="${esc(alert.id)}" title="Train the AI that this variance is expected">
          Mark expected
        </button>
      </div>
    </article>`;
  }

  function renderAlerts() {
    const { alerts } = state.dashboard;
    const openAlerts = alerts.filter((alert) => !alert.trained);
    const filter = state.alertFilter;

    $('#alert-count').textContent = String(openAlerts.length);
    const dot = $('#notification-dot');
    if (dot) dot.classList.toggle('hidden', openAlerts.length === 0);

    let list = alerts;
    if (filter === 'high' || filter === 'medium') {
      list = alerts.filter((alert) => alert.severity === filter);
    }
    list = [...list].sort((a, b) => Number(a.trained) - Number(b.trained));

    $('#alerts-feed').innerHTML = list.length
      ? list.map(renderAlertCard).join('')
      : `<div class="card px-4 py-8 text-center">
          <span class="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">${icon('check', 'h-4 w-4')}</span>
          <p class="mt-2 text-[12px] font-medium text-gray-200">No ${esc(filter)} alerts</p>
          <p class="mt-0.5 text-[11px] text-slate-500">The AI triage queue is clear for this filter.</p>
        </div>`;

    $$('[data-alert-filter]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.alertFilter === filter));
    });
  }

  function trendChart(trend, accent, key) {
    const width = 320;
    const height = 96;
    const pad = 6;
    const palette = ACCENTS[accent] || ACCENTS.emerald;
    const max = Math.max(...trend);
    const min = Math.min(...trend);
    const span = max - min || 1;
    const points = trend.map((value, index) => {
      const x = pad + (index * (width - pad * 2)) / (trend.length - 1);
      const y = height - pad - ((value - min) / span) * (height - pad * 2);
      return [x, y];
    });
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ');
    const area = `${line} L${width - pad} ${height} L${pad} ${height} Z`;
    const gradient = `trend-${key}`;
    const grid = [0.25, 0.5, 0.75]
      .map((ratio) => `<line x1="${pad}" x2="${width - pad}" y1="${(height * ratio).toFixed(1)}" y2="${(height * ratio).toFixed(1)}" stroke="rgba(148,163,184,0.1)" stroke-dasharray="3 5"/>`)
      .join('');
    const last = points[points.length - 1];
    return `<svg viewBox="0 0 ${width} ${height}" class="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      ${grid}
      <defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.hex}" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="${palette.hex}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#${gradient})"/>
      <path d="${line}" fill="none" stroke="${palette.hex}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3" fill="#0f172a" stroke="${palette.hex}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    </svg>`;
  }

  function renderRevenue() {
    const section = $('#main-content > section[data-view="revenue"]');
    if (!section) return;
    const { departments, totals, location } = state.dashboard;
    const selected = departments.find((department) => department.id === state.department) || departments[0];
    state.department = selected.id;
    const accent = ACCENTS[selected.accent] || ACCENTS.emerald;
    const tone = marginTone(selected.margin);
    const share = totals.net ? Math.round((selected.net / totals.net) * 100) : 0;
    const positive = selected.delta >= 0;
    const activePill = 'bg-slate-700/80 text-white shadow-sm';

    const pills = departments
      .map(
        (department) => `<button type="button" data-department-pill="${esc(department.id)}" aria-pressed="${department.id === selected.id}"
          class="rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
            department.id === selected.id ? activePill : 'text-slate-400 hover:bg-white/[0.05] hover:text-gray-200'
          }">${esc(department.name)}</button>`,
      )
      .join('');

    const comparison = departments
      .map((department) => {
        const itemAccent = ACCENTS[department.accent] || ACCENTS.emerald;
        const itemTone = marginTone(department.margin);
        const active = department.id === selected.id;
        return `<button type="button" data-department-pill="${esc(department.id)}" aria-pressed="${active}"
          class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${active ? 'bg-white/[0.05]' : 'hover:bg-white/[0.04]'}">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${itemAccent.bg} ${itemAccent.text} ring-1 ring-inset ${itemAccent.ring}">
            ${icon(department.icon, 'h-4 w-4')}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[12px] font-medium text-gray-200">${esc(department.name)}</span>
            <span class="block truncate text-[10px] text-slate-500">${esc(department.meta)}</span>
          </span>
          <span class="hidden h-7 w-[86px] shrink-0 sm:block">${sparkline(department.trend, department.accent, `rev-${department.id}`)}</span>
          <span class="w-[86px] shrink-0 text-right">
            <span class="block text-[9px] uppercase tracking-wider text-slate-500">Net</span>
            <span class="block truncate text-[12px] font-semibold text-white tabular">${money(department.net, { compact: 'auto' })}</span>
          </span>
          <span class="w-[52px] shrink-0 text-right text-[11px] font-medium ${itemTone.text} tabular">${pct(department.margin)}</span>
        </button>`;
      })
      .join('');

    const insight = positive
      ? `${selected.name} is ${pct(selected.delta)} ahead of last week and covers ${share}% of consolidated net. Protect weekend rate integrity.`
      : `${selected.name} is ${pct(Math.abs(selected.delta))} behind last week. Review ${
          selected.id === 'fnb' ? 'purchase orders and waste logs' : 'scheduled labour and OTA commissions'
        } before the weekend pickup.`;

    section.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Revenue intelligence</p>
          <h1 class="mt-1 text-[22px] font-semibold tracking-tight text-white sm:text-2xl">Department performance</h1>
          <p class="mt-1 text-[12.5px] text-slate-400">${esc(location.label)} · ${esc(dayLabel(yesterday()))} · reconciled ${esc(
            timeLabel(state.dashboard.sync.lastSync, true),
          )}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button type="button" class="btn" data-action="export">${icon('download', 'h-3.5 w-3.5')} Export</button>
          <button type="button" class="btn-primary" data-action="ask-dept">${icon('sparkles', 'h-3.5 w-3.5')} Ask AI</button>
        </div>
      </div>

      <div class="card flex flex-wrap items-center gap-1 p-1" role="tablist" aria-label="Departments">${pills}</div>

      <article class="card relative overflow-hidden">
        <div class="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.bg} ${accent.text} ring-1 ring-inset ${accent.ring}">
            ${icon(selected.icon, 'h-5 w-5')}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-white">${esc(selected.name)}</p>
            <p class="truncate text-[11px] text-slate-500">${esc(selected.meta)} · ${pct(selected.margin)} net margin</p>
          </div>
          <span class="chip ${positive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}">
            ${positive ? '▲' : '▼'} ${pct(Math.abs(selected.delta))} WoW
          </span>
        </div>
        <div class="grid gap-5 px-4 py-4 sm:px-5 lg:grid-cols-[1fr_1.15fr]">
          <div class="min-w-0">
            <p class="label">Net contribution</p>
            <p class="mt-1 truncate text-3xl font-semibold tracking-tight text-white tabular">${money(selected.net)}</p>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span class="chip bg-white/[0.04] text-slate-400">${share}% of group net</span>
              <span class="chip bg-white/[0.04] text-slate-400">Peak ${money(selected.peak, { compact: 'auto' })}</span>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <div class="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <p class="text-[10px] uppercase tracking-[0.12em] text-slate-500">Gross income</p>
                <p class="mt-0.5 truncate text-sm font-semibold text-gray-100 tabular">${money(selected.gross)}</p>
              </div>
              <div class="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <p class="text-[10px] uppercase tracking-[0.12em] text-slate-500">Expenses</p>
                <p class="mt-0.5 truncate text-sm font-semibold text-gray-100 tabular">${money(selected.expenses)}</p>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-500">Margin vs 50% board target</span>
                <span class="font-medium ${tone.text} tabular">${pct(selected.margin)}</span>
              </div>
              <div class="relative mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
                <div class="h-full rounded-full ${tone.bar}" style="width:${clamp(selected.margin)}%"></div>
                <span class="absolute inset-y-0 left-1/2 w-px bg-white/40"></span>
              </div>
            </div>
          </div>
          <div class="rounded-xl border border-white/[0.06] bg-slate-900/40 p-3">
            <div class="flex items-center justify-between gap-2">
              <p class="label">7-day gross trend</p>
              <span class="text-[10px] text-slate-500 tabular">${money(selected.gross, { compact: 'auto' })} yesterday</span>
            </div>
            <div class="mt-2 h-[104px]">${trendChart(selected.trend, selected.accent, `revenue-${selected.id}`)}</div>
            <div class="mt-1 flex justify-between text-[9px] uppercase tracking-wider text-slate-600">
              <span>7d ago</span><span>midweek</span><span>Yesterday</span>
            </div>
          </div>
        </div>
        <div class="flex items-start gap-2 border-t border-white/[0.06] bg-white/[0.015] px-4 py-3 text-[11.5px] leading-relaxed text-slate-400 sm:px-5">
          <span class="mt-px shrink-0 text-emerald-300">${icon('sparkles', 'h-3.5 w-3.5')}</span>
          <p>${esc(insight)}</p>
        </div>
      </article>

      <section class="card overflow-hidden" aria-labelledby="compare-heading">
        <div class="flex flex-wrap items-end justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
          <div>
            <h2 id="compare-heading" class="text-sm font-semibold text-white">All departments</h2>
            <p class="mt-0.5 text-[11px] text-slate-500">Net contribution, margin and 7-day shape · select a row to inspect</p>
          </div>
          <button type="button" class="btn !px-2.5 !py-1.5 text-[11px]" data-action="export">${icon('download', 'h-3.5 w-3.5')} CSV</button>
        </div>
        <div class="divide-y divide-white/[0.05]">${comparison}</div>
      </section>`;
  }


  function renderSync() {
    const section = $('#main-content > section[data-view="sync"]');
    if (!section) return;
    const { sync, health } = state.dashboard;
    const live = sync.entities.filter((entity) => entity.status === 'synced').length;
    const records = sync.entities.reduce((sum, entity) => sum + entity.records, 0);
    const trained = state.trainingLog;

    const entities = sync.entities
      .map((entity) => {
        const ok = entity.status === 'synced';
        return `<div class="flex items-center gap-3 px-4 py-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            ok ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20' : 'bg-amber-500/10 text-amber-300 ring-amber-400/20'
          } ring-1 ring-inset">${icon(entity.icon, 'h-4 w-4')}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[12.5px] font-medium text-gray-200">${esc(entity.name)}</span>
            <span class="block truncate text-[10.5px] text-slate-500">${esc(entity.system)} · ${entity.records.toLocaleString(
              'en-US',
            )} records · ${entity.latencyMs} ms</span>
            ${entity.note ? `<span class="mt-0.5 block truncate text-[10px] text-amber-300/80">${esc(entity.note)}</span>` : ''}
          </span>
          <span class="chip shrink-0 ${ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}">
            ${ok ? 'Live' : 'Delayed'}
          </span>
        </div>`;
      })
      .join('');

    const events = sync.events
      .map((event, index) => {
        const ok = event.status === 'ok';
        return `<li class="relative flex gap-3 pb-3.5 last:pb-0">
          <span class="relative flex w-3 shrink-0 justify-center">
            <span class="mt-1 h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'} ring-4 ring-slate-900"></span>
            ${index < sync.events.length - 1 ? '<span class="absolute left-1/2 top-4 h-full w-px -translate-x-1/2 bg-white/[0.07]"></span>' : ''}
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center justify-between gap-2">
              <span class="truncate text-[12px] font-medium text-gray-200">${esc(event.label)}</span>
              <span class="shrink-0 text-[10px] text-slate-500 tabular">${esc(event.time)}</span>
            </span>
            <span class="mt-0.5 block text-[10.5px] text-slate-500">${esc(event.detail)}</span>
          </span>
        </li>`;
      })
      .join('');

    const trainingRows = trained.length
      ? trained
          .map(
            (entry) => `<li class="flex items-center gap-2 border-t border-white/[0.05] px-4 py-2.5 first:border-t-0">
              <span class="text-emerald-300">${icon('check', 'h-3.5 w-3.5')}</span>
              <span class="min-w-0 flex-1 truncate text-[11.5px] text-gray-300">${esc(entry.title)}</span>
              <span class="shrink-0 text-[10px] text-slate-500 tabular">${esc(entry.at)}</span>
            </li>`,
          )
          .join('')
      : `<li class="px-4 py-6 text-center text-[11.5px] text-slate-500">
          No patterns learned yet — mark a discrepancy as expected to train the model.
        </li>`;

    section.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Data operations</p>
          <h1 class="mt-1 text-[22px] font-semibold tracking-tight text-white sm:text-2xl">Sync &amp; data quality</h1>
          <p class="mt-1 text-[12.5px] text-slate-400">PMS, POS, inventory and ledger ingestion · ${esc(health.note)}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button type="button" class="btn" data-action="force-sync">${icon('refresh', 'h-3.5 w-3.5')} Force sync</button>
          <button type="button" class="btn" data-action="reset-training">Reset AI training</button>
        </div>
      </div>

      <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div class="card p-3.5">
          <p class="label">Last sync</p>
          <p class="mt-1 text-lg font-semibold text-white tabular" data-sync-relative>${relativeTime(sync.lastSync)}</p>
          <p class="mt-0.5 text-[10.5px] text-slate-500">${esc(
            new Date(sync.lastSync).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          )} local time</p>
        </div>
        <div class="card p-3.5">
          <p class="label">Entities live</p>
          <p class="mt-1 text-lg font-semibold text-white tabular">${live}<span class="text-slate-500">/${sync.entities.length}</span></p>
          <p class="mt-0.5 text-[10.5px] text-slate-500">${sync.entities.length - live} delayed · retrying</p>
        </div>
        <div class="card p-3.5">
          <p class="label">Records ingested</p>
          <p class="mt-1 text-lg font-semibold text-white tabular">${records.toLocaleString('en-US')}</p>
          <p class="mt-0.5 text-[10.5px] text-slate-500">0 write conflicts</p>
        </div>
        <div class="card p-3.5">
          <p class="label">AI patterns learned</p>
          <p class="mt-1 text-lg font-semibold text-emerald-300 tabular">${sync.trainedPatterns}</p>
          <p class="mt-0.5 text-[10.5px] text-slate-500">Suppressed from alert feed</p>
        </div>
      </div>

      <div class="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <section class="card overflow-hidden" aria-labelledby="entities-heading">
          <div class="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
            <h2 id="entities-heading" class="text-sm font-semibold text-white">Connected systems</h2>
            <span class="chip bg-white/[0.04] text-slate-400">${live} healthy</span>
          </div>
          <div class="divide-y divide-white/[0.05]">${entities}</div>
        </section>
        <section class="card p-4" aria-labelledby="events-heading">
          <div class="flex items-center justify-between gap-2">
            <h2 id="events-heading" class="text-sm font-semibold text-white">Overnight pipeline</h2>
            <span class="text-[10px] text-slate-500">Today</span>
          </div>
          <ol class="mt-3.5">${events}</ol>
        </section>
      </div>

      <section class="card overflow-hidden" aria-labelledby="training-heading">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
          <div>
            <h2 id="training-heading" class="text-sm font-semibold text-white">AI training memory</h2>
            <p class="mt-0.5 text-[11px] text-slate-500">Variances you marked as expected this session</p>
          </div>
          <span class="chip bg-emerald-500/10 text-emerald-300">${trained.length} pattern${trained.length === 1 ? '' : 's'}</span>
        </div>
        <ul>${trainingRows}</ul>
      </section>`;
  }

  const LEDGER_STATUS_TONES = {
    reconciled: 'bg-emerald-500/10 text-emerald-300',
    pending: 'bg-amber-500/10 text-amber-300',
    review: 'bg-rose-500/10 text-rose-300',
  };

  const LEDGER_SELECT_CLASS =
    'rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-1.5 text-[11.5px] font-medium text-gray-200 outline-none transition hover:border-white/20 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20';

  function ledgerOptions(facet, allLabel) {
    return [`<option value="all">${esc(allLabel)}</option>`]
      .concat(facet.map((item) => `<option value="${esc(item.value)}">${esc(item.value)} (${item.count})</option>`))
      .join('');
  }

  async function loadLedger(force = false) {
    const section = $('#main-content > section[data-view="ledger"]');
    if (!section) return;
    if (!force && state.ledger && state.ledger.location.id === state.location) {
      renderLedger();
      return;
    }
    if (state.ledgerLoading) return;
    state.ledgerLoading = true;
    const requested = state.location;
    section.innerHTML = `<div class="card flex items-center gap-2 px-4 py-10 text-[12px] text-slate-400">
      <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
      <span class="ml-1">Loading ledger postings…</span>
    </div>`;
    try {
      const payload = await api(`/api/ledger?location=${encodeURIComponent(requested)}`);
      if (state.location !== requested) return;
      state.ledger = payload;
      state.ledgerPage = 1;
      renderLedger();
    } catch (error) {
      section.innerHTML = `<div class="card px-4 py-6 text-[12px] text-rose-200">Could not load the ledger: ${esc(error.message)}</div>`;
      toast(`Ledger unavailable: ${error.message}`, 'error');
    } finally {
      state.ledgerLoading = false;
    }
  }

  function renderLedger() {
    const section = $('#main-content > section[data-view="ledger"]');
    if (!section || !state.ledger) return;
    const data = state.ledger;
    const { location, currency, facets, reconciliation } = data;
    const balanced = reconciliation.balanced;

    section.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Finance ledger</p>
          <h1 class="mt-1 text-[22px] font-semibold tracking-tight text-white">Raw finance data</h1>
          <p class="mt-1 text-[12.5px] text-slate-400">
            Every posting behind the dashboard · ${esc(location.label)} · ${esc(currency)} ·
            <span class="text-gray-200">${dayLabel(new Date(`${data.date}T00:00:00`), true)}</span>
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button type="button" class="btn" data-action="ledger-reset">Clear filters</button>
          <button type="button" class="btn-primary" data-action="ledger-export">${icon('download', 'h-3.5 w-3.5')} Export CSV</button>
        </div>
      </div>

      <div id="ledger-stats" class="grid grid-cols-2 gap-2.5 lg:grid-cols-4"></div>

      <div class="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-[11px] ${
        balanced ? 'border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-200' : 'border-amber-400/25 bg-amber-500/[0.08] text-amber-200'
      }">
        ${icon(balanced ? 'check' : 'alert', 'h-3.5 w-3.5 shrink-0')}
        <span class="flex-1">
          ${balanced ? 'Ties to the departmental totals' : 'Does not tie to the departmental totals'}
          · ${money(reconciliation.ledgerRevenue)} revenue · ${money(reconciliation.ledgerExpenses)} expenses · ${data.rows.length} postings
        </span>
      </div>

      <section class="card overflow-hidden" aria-labelledby="ledger-table-heading">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
          <div class="min-w-0">
            <h2 id="ledger-table-heading" class="text-sm font-semibold text-white">All finance postings</h2>
            <p class="mt-0.5 text-[11px] text-slate-500">PMS, POS, OTA, supplier and ledger exports for the day</p>
          </div>
          <div id="ledger-direction" class="segmented shrink-0" role="group" aria-label="Filter by posting type">
            <button type="button" data-ledger-direction="all" aria-pressed="true">All</button>
            <button type="button" data-ledger-direction="revenue" aria-pressed="false">Revenue</button>
            <button type="button" data-ledger-direction="expense" aria-pressed="false">Expenses</button>
          </div>
        </div>

        <div class="flex flex-col gap-2 border-b border-white/[0.06] px-3.5 py-3">
          <div class="flex flex-wrap items-center gap-2">
            <label class="relative min-w-[220px] flex-1">
              <span class="sr-only">Search postings</span>
              <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">${icon('search', 'h-3.5 w-3.5')}</span>
              <input id="ledger-search" type="search" autocomplete="off" placeholder="Search reference, detail, source or amount"
                class="field py-1.5 pl-8 text-[12px]" />
            </label>
            <select id="ledger-department" data-ledger-filter="department" aria-label="Filter by department"
              class="${LEDGER_SELECT_CLASS}">${ledgerOptions(facets.departments, 'All departments')}</select>
            <select id="ledger-category" data-ledger-filter="category" aria-label="Filter by category"
              class="${LEDGER_SELECT_CLASS}">${ledgerOptions(facets.categories, 'All categories')}</select>
            <select id="ledger-source" data-ledger-filter="source" aria-label="Filter by source system"
              class="${LEDGER_SELECT_CLASS}">${ledgerOptions(facets.sources, 'All sources')}</select>
            <select id="ledger-status" data-ledger-filter="status" aria-label="Filter by status"
              class="${LEDGER_SELECT_CLASS}">${ledgerOptions(facets.statuses, 'All statuses')}</select>
          </div>
          <p id="ledger-count" class="text-[10.5px] text-slate-500"></p>
        </div>

        <div id="ledger-table" class="max-h-[620px] overflow-auto"></div>
        <div id="ledger-pagination" class="border-t border-white/[0.06] px-4 py-3"></div>
      </section>`;

    syncLedgerControls();
    paintLedger();
  }

  function ledgerRows() {
    const data = state.ledger;
    if (!data) return [];
    const filters = state.ledgerFilters;
    const query = filters.query.trim().toLowerCase();
    const matched = data.rows.filter((row) => {
      if (filters.department !== 'all' && row.department !== filters.department) return false;
      if (filters.category !== 'all' && row.category !== filters.category) return false;
      if (filters.source !== 'all' && row.source !== filters.source) return false;
      if (filters.status !== 'all' && row.status !== filters.status) return false;
      if (filters.direction !== 'all' && row.direction !== filters.direction) return false;
      if (!query) return true;
      const haystack =
        `${row.ref} ${row.department} ${row.category} ${row.description} ${row.source} ${row.method} ${row.status} ${row.note} ${Math.abs(row.amount)}`.toLowerCase();
      return haystack.includes(query);
    });

    const { key, dir } = state.ledgerSort;
    const factor = dir === 'asc' ? 1 : -1;
    return matched.sort((a, b) => {
      if (key === 'amount') return (Math.abs(a.amount) - Math.abs(b.amount)) * factor;
      if (key === 'department') return a.department.localeCompare(b.department) * factor;
      if (key === 'category') return a.category.localeCompare(b.category) * factor;
      return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) * factor;
    });
  }

  function ledgerTotals(rows) {
    const revenue = rows.filter((row) => row.direction === 'revenue').reduce((sum, row) => sum + row.amount, 0);
    const expenses = rows
      .filter((row) => row.direction === 'expense')
      .reduce((sum, row) => sum + Math.abs(row.amount), 0);
    return { revenue, expenses, net: revenue - expenses };
  }

  function toggleLedgerSort(key) {
    if (state.ledgerSort.key === key) {
      state.ledgerSort = { key, dir: state.ledgerSort.dir === 'asc' ? 'desc' : 'asc' };
    } else {
      state.ledgerSort = { key, dir: key === 'amount' ? 'desc' : 'asc' };
    }
    paintLedger();
  }

  function ledgerSortHeader(key, label, align, extra = '') {
    const active = state.ledgerSort.key === key;
    const caret = active ? (state.ledgerSort.dir === 'asc' ? '▲' : '▼') : '';
    return `<th scope="col" aria-sort="${
      active ? (state.ledgerSort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
    }" class="sticky top-0 z-10 bg-slate-900/95 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] backdrop-blur ${align} ${extra}">
      <button type="button" data-ledger-sort="${key}" class="inline-flex items-center gap-1 uppercase tracking-[0.1em] transition hover:text-gray-200 ${
        active ? 'text-emerald-300' : 'text-slate-500'
      }">${esc(label)}<span class="text-[8px]">${caret}</span></button>
    </th>`;
  }

  const LEDGER_PLAIN_HEAD = (label, align = 'text-left', extra = '') =>
    `<th scope="col" class="sticky top-0 z-10 bg-slate-900/95 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 backdrop-blur ${align} ${extra}">${esc(
      label,
    )}</th>`;

  function ledgerTableHtml(pageRows) {
    const body = pageRows.length
      ? pageRows
          .map((row) => {
            const statusTone = LEDGER_STATUS_TONES[row.status] || 'bg-white/[0.04] text-slate-400';
            const statusLabel = state.ledger.statusLabels[row.status] || row.status;
            return `<tr class="border-t border-white/[0.05] transition hover:bg-white/[0.03]">
              <td class="hidden whitespace-nowrap px-3 py-2.5 text-[11.5px] text-slate-400 tabular sm:table-cell">${esc(
                dayLabel(new Date(`${row.date}T00:00:00`)),
              )}<span class="text-slate-600"> · ${esc(row.time)}</span></td>
              <td class="hidden whitespace-nowrap px-2 py-2.5 font-mono text-[10px] text-slate-500 lg:table-cell">${esc(row.ref)}</td>
              <td class="hidden whitespace-nowrap px-2 py-2.5 text-[11.5px] text-gray-300 sm:table-cell">${esc(row.department)}</td>
              <td class="whitespace-nowrap px-2 py-2.5"><span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ${
                row.direction === 'revenue' ? 'bg-emerald-500/[0.08] text-emerald-200/90' : 'bg-white/[0.05] text-gray-300'
              }">${esc(row.category)}</span></td>
              <td class="max-w-[200px] px-2 py-2.5 sm:max-w-[280px]">
                <span class="block truncate text-[11.5px] text-gray-200">${esc(row.description)}</span>
                <span class="block truncate text-[10px] text-slate-500">${esc(row.method)}${
                  row.note ? ` · ${esc(row.note)}` : ''
                }</span>
              </td>
              <td class="hidden whitespace-nowrap px-2 py-2.5 text-[11px] text-slate-400 lg:table-cell">${esc(row.source)}</td>
              <td class="hidden whitespace-nowrap px-2 py-2.5 md:table-cell"><span class="chip ${statusTone}">${esc(
                statusLabel,
              )}</span></td>
              <td class="sticky right-0 bg-slate-900/95 px-3 py-2.5 text-right text-[11.5px] font-semibold tabular backdrop-blur ${
                row.amount < 0 ? 'text-rose-300' : 'text-emerald-300'
              }">${money(row.amount, { signed: true })}</td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="8" class="px-4 py-12 text-center text-[12px] text-slate-500">
          No postings match these filters.
          <button type="button" class="text-emerald-300 underline decoration-dotted underline-offset-2" data-action="ledger-reset">Clear filters</button>
        </td></tr>`;

    return `<table class="w-full border-collapse text-left sm:min-w-[560px] lg:min-w-[960px]">
      <thead>
        <tr>
          ${ledgerSortHeader('time', 'Date', 'text-left', 'hidden sm:table-cell')}
          ${LEDGER_PLAIN_HEAD('Reference', 'text-left', 'hidden lg:table-cell')}
          ${ledgerSortHeader('department', 'Department', 'text-left', 'hidden sm:table-cell')}
          ${ledgerSortHeader('category', 'Category', 'text-left')}
          ${LEDGER_PLAIN_HEAD('Detail')}
          ${LEDGER_PLAIN_HEAD('Source', 'text-left', 'hidden lg:table-cell')}
          ${LEDGER_PLAIN_HEAD('Status', 'text-left', 'hidden md:table-cell')}
          ${ledgerSortHeader('amount', 'Amount', 'text-right', 'right-0 z-20')}
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
  }

  function paintLedger() {
    if (!state.ledger) return;
    const rows = ledgerRows();
    const totals = ledgerTotals(rows);
    const pages = Math.max(1, Math.ceil(rows.length / state.ledgerPageSize));
    if (state.ledgerPage > pages) state.ledgerPage = pages;
    const start = (state.ledgerPage - 1) * state.ledgerPageSize;
    const pageRows = rows.slice(start, start + state.ledgerPageSize);

    const stats = $('#ledger-stats');
    if (stats) {
      const cards = [
        {
          label: 'Revenue in view',
          value: money(totals.revenue),
          tone: 'text-emerald-300',
          note: 'Cash, card and ledger credits',
        },
        {
          label: 'Expenses in view',
          value: money(totals.expenses),
          tone: 'text-rose-300',
          note: 'Payroll, supplier and commission debits',
        },
        {
          label: 'Net in view',
          value: money(totals.net, { signed: true }),
          tone: totals.net < 0 ? 'text-rose-300' : 'text-white',
          note: 'Revenue less expenses',
        },
        {
          label: 'Postings in view',
          value: rows.length.toLocaleString('en-US'),
          tone: 'text-white',
          note: `${state.ledger.rows.length} for the day`,
        },
      ];
      stats.innerHTML = cards
        .map(
          (card) => `<div class="card p-3.5">
            <p class="label">${card.label}</p>
            <p class="mt-1 text-lg font-semibold tabular ${card.tone}">${card.value}</p>
            <p class="mt-0.5 text-[10.5px] text-slate-500">${card.note}</p>
          </div>`,
        )
        .join('');
    }

    const count = $('#ledger-count');
    if (count) {
      count.innerHTML = `${rows.length} of ${state.ledger.rows.length} postings · <span class="text-gray-300">${money(
        totals.revenue,
      )}</span> revenue · <span class="text-gray-300">${money(totals.expenses)}</span> expenses · <span class="${
        totals.net < 0 ? 'text-rose-300' : 'text-emerald-300'
      }">${money(totals.net, { signed: true })}</span> net`;
    }

    const table = $('#ledger-table');
    if (table) {
      table.innerHTML = ledgerTableHtml(pageRows);
      table.scrollTop = 0;
    }

    const pager = $('#ledger-pagination');
    if (pager) {
      const end = Math.min(start + state.ledgerPageSize, rows.length);
      pager.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-[11px] text-slate-500">
          Showing <span class="text-gray-300 tabular">${rows.length ? start + 1 : 0}–${end}</span>
          of <span class="text-gray-300 tabular">${rows.length}</span>
        </p>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-1.5 text-[10.5px] text-slate-500">
            Rows
            <select id="ledger-page-size" aria-label="Rows per page"
              class="rounded-md border border-white/10 bg-slate-900/70 px-1.5 py-1 text-[11px] text-gray-200">
              ${[25, 50, 100]
                .map((size) => `<option value="${size}"${state.ledgerPageSize === size ? ' selected' : ''}>${size}</option>`)
                .join('')}
            </select>
          </label>
          <button type="button" class="btn disabled:opacity-40" data-action="ledger-prev" ${
            state.ledgerPage <= 1 ? 'disabled' : ''
          }>Prev</button>
          <span class="text-[11px] text-slate-500 tabular">${state.ledgerPage} / ${pages}</span>
          <button type="button" class="btn disabled:opacity-40" data-action="ledger-next" ${
            state.ledgerPage >= pages ? 'disabled' : ''
          }>Next</button>
        </div>
      </div>`;
    }

    $$('#ledger-direction [data-ledger-direction]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.ledgerDirection === state.ledgerFilters.direction));
    });
  }

  function syncLedgerControls() {
    if (!state.ledger) return;
    const filters = state.ledgerFilters;
    const input = $('#ledger-search');
    if (input) input.value = filters.query;
    ['department', 'category', 'source', 'status'].forEach((key) => {
      const select = $(`#ledger-${key}`);
      if (select) select.value = filters[key];
    });
  }

  function setLedgerPage(page) {
    const rows = ledgerRows();
    const pages = Math.max(1, Math.ceil(rows.length / state.ledgerPageSize));
    state.ledgerPage = Math.min(Math.max(1, page), pages);
    paintLedger();
    $('#ledger-table')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetLedgerFilters() {
    state.ledgerFilters = { department: 'all', category: 'all', source: 'all', status: 'all', direction: 'all', query: '' };
    state.ledgerSort = { key: 'time', dir: 'desc' };
    state.ledgerPage = 1;
    syncLedgerControls();
    paintLedger();
  }

  function ledgerCsv() {
    if (!state.ledger) return;
    const rows = ledgerRows();
    if (!rows.length) {
      toast('No postings to export with these filters', 'info');
      return;
    }
    const header = [
      'Reference',
      'Date',
      'Time',
      'Location',
      'Department',
      'Category',
      'Type',
      'Detail',
      'Source',
      'Method',
      'Status',
      'Amount',
      'Currency',
      'Note',
    ];
    const csv = [
      header,
      ...rows.map((row) => [
        row.ref,
        row.date,
        row.time,
        row.location,
        row.department,
        row.category,
        row.direction,
        row.description,
        row.source,
        row.method,
        row.status,
        row.amount,
        state.ledger.currency,
        row.note,
      ]),
    ]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mad-vervet-ledger-${state.ledger.location.id}-${state.ledger.date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Exported ${rows.length} postings · ${state.ledger.currency}`);
  }

  const SETTINGS_KEY = 'mv-exec-settings';
  const DEFAULT_SETTINGS = { autoSync: true, morningBrief: true, anomalyPush: true, weeklyDigest: false };

  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      state.settings = { ...DEFAULT_SETTINGS, ...stored };
    } catch (error) {
      state.settings = { ...DEFAULT_SETTINGS };
    }
    return state.settings;
  }

  function saveSettings(patch) {
    state.settings = { ...DEFAULT_SETTINGS, ...state.settings, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    } catch (error) {
      /* storage unavailable — session-only preferences */
    }
  }

  function settingToggle(key, title, description) {
    return `<label class="flex cursor-pointer items-start gap-3 border-t border-white/[0.05] px-4 py-3 first:border-t-0">
      <span class="min-w-0 flex-1">
        <span class="block text-[12.5px] font-medium text-gray-200">${esc(title)}</span>
        <span class="mt-0.5 block text-[11px] leading-relaxed text-slate-500">${esc(description)}</span>
      </span>
      <input type="checkbox" class="peer sr-only" data-pref="${esc(key)}" ${state.settings?.[key] ? 'checked' : ''}>
      <span class="switch" aria-hidden="true"></span>
    </label>`;
  }

  function renderSettings() {
    const section = $('#main-content > section[data-view="settings"]');
    if (!section) return;
    const { location, currency, sync } = state.dashboard;
    const rows = [
      ['Workspace', 'Mad Vervet Hostels · Executive'],
      ['Active context', `${location.label} — ${location.region}`],
      ['Reporting currency', currency],
      ['Timezone', `${location.tzLabel} · ${location.timezone}`],
      ['Close of books', `Yesterday · ${dayLabel(yesterday(), true)}`],
      ['Data owner', 'Finance systems · finance@madvervet.com'],
    ];

    section.innerHTML = `
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Administration</p>
          <h1 class="mt-1 text-[22px] font-semibold tracking-tight text-white sm:text-2xl">Workspace settings</h1>
          <p class="mt-1 text-[12.5px] text-slate-400">Executive console configuration · admin scope</p>
        </div>
        <button type="button" class="btn-primary shrink-0" data-action="save-settings">${icon('check', 'h-3.5 w-3.5')} Save changes</button>
      </div>

      <div class="grid gap-3 lg:grid-cols-2">
        <section class="card overflow-hidden" aria-labelledby="workspace-heading">
          <div class="border-b border-white/[0.06] px-4 py-3">
            <h2 id="workspace-heading" class="text-sm font-semibold text-white">Workspace</h2>
            <p class="mt-0.5 text-[11px] text-slate-500">Read-only values inherited from the ERP sync</p>
          </div>
          <dl class="divide-y divide-white/[0.05]">
            ${rows
              .map(
                ([label, value]) => `<div class="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt class="text-[11.5px] text-slate-500">${esc(label)}</dt>
                  <dd class="min-w-0 truncate text-right text-[12px] font-medium text-gray-200">${esc(value)}</dd>
                </div>`,
              )
              .join('')}
          </dl>
        </section>

        <section class="card overflow-hidden" aria-labelledby="prefs-heading">
          <div class="border-b border-white/[0.06] px-4 py-3">
            <h2 id="prefs-heading" class="text-sm font-semibold text-white">Automation &amp; notifications</h2>
            <p class="mt-0.5 text-[11px] text-slate-500">Applies to this browser · saved locally</p>
          </div>
          <div>
            ${settingToggle('autoSync', 'Auto-sync every 15 minutes', 'Pull PMS, POS and ledger journals in the background.')}
            ${settingToggle('morningBrief', 'Email the AI morning brief', 'Deliver the 06:12 brief to the executive list.')}
            ${settingToggle('anomalyPush', 'Push high-severity anomalies', 'Notify this device when the AI detects a high-severity flag.')}
            ${settingToggle('weeklyDigest', 'Weekly board digest', 'Monday 07:00 summary of margins, flags and cash position.')}
          </div>
        </section>
      </div>



      <div class="grid gap-3 lg:grid-cols-2">
        <section class="card p-4" aria-labelledby="ai-heading">
          <h2 id="ai-heading" class="text-sm font-semibold text-white">AI &amp; anomaly engine</h2>
          <div class="mt-3 space-y-2 text-[11.5px]">
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Model</span><span class="font-medium text-gray-200">verve-fin-v3</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Triage confidence floor</span><span class="font-medium text-gray-200 tabular">85%</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Patterns learned</span>
              <span class="font-medium text-emerald-300 tabular">${sync.trainedPatterns}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-slate-500">Last retrain</span><span class="font-medium text-gray-200">Today · 05:58</span>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" class="btn" data-action="reset-training">Reset training memory</button>
            <button type="button" class="btn" data-action="ask-brief">Ask the assistant</button>
          </div>
        </section>

        <section class="card p-4" aria-labelledby="data-heading">
          <h2 id="data-heading" class="text-sm font-semibold text-white">Data &amp; retention</h2>
          <p class="mt-1 text-[11.5px] leading-relaxed text-slate-500">
            Financial records are retained for seven years in the Sage ledger. The console caches a rolling 13-month
            aggregation and never writes back to the PMS without finance approval.
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" class="btn" data-action="export">${icon('download', 'h-3.5 w-3.5')} Export workspace data</button>
            <button type="button" class="btn" data-action="force-sync">${icon('refresh', 'h-3.5 w-3.5')} Force sync</button>
          </div>
          <p class="mt-3 flex items-center gap-1.5 text-[10.5px] text-slate-500">
            ${icon('shield', 'h-3.5 w-3.5')} SSO enforced · audit trail on all exports
          </p>
        </section>
      </div>`;
  }

  function chatTable(table) {
    if (!table || !table.rows?.length) return '';
    const head = table.columns
      .map((column) => `<th scope="col" class="whitespace-nowrap px-2.5 py-1.5 text-left text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">${esc(column)}</th>`)
      .join('');
    const body = table.rows
      .map(
        (row) => `<tr class="border-t border-white/[0.05]">${row.cells
          .map((cell, index) => {
            const last = index === row.cells.length - 1 && row.cells.length > 1;
            return `<td class="px-2.5 py-1.5 ${last ? 'text-right font-medium text-gray-100 tabular' : 'text-gray-300'}">${esc(cell)}</td>`;
          })
          .join('')}</tr>`,
      )
      .join('');
    return `<div class="overflow-hidden rounded-xl border border-white/[0.07] bg-slate-900/40">
      <p class="border-b border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold text-gray-200">${esc(table.title)}</p>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[220px] text-left text-[11px]">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      ${table.note ? `<p class="border-t border-white/[0.05] px-2.5 py-1.5 text-[10px] text-slate-500">${esc(table.note)}</p>` : ''}
    </div>`;
  }

  function chatVerdict(verdict) {
    if (!verdict) return '';
    const tones = {
      positive: 'bg-emerald-500/[0.08] text-emerald-200 ring-emerald-400/20',
      warning: 'bg-amber-500/[0.08] text-amber-200 ring-amber-400/20',
      negative: 'bg-rose-500/[0.08] text-rose-200 ring-rose-400/20',
    };
    const glyph = verdict.tone === 'positive' ? 'check' : 'alert';
    return `<p class="flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[11px] leading-relaxed ring-1 ring-inset ${
      tones[verdict.tone] || tones.warning
    }">
      <span class="mt-px shrink-0">${icon(glyph, 'h-3.5 w-3.5')}</span>
      <span class="min-w-0">${esc(verdict.text)}</span>
    </p>`;
  }

  function chatAvatar() {
    return `<span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
      ${icon('sparkles', 'h-3.5 w-3.5')}
    </span>`;
  }

  function renderChat() {
    const log = $('#chat-messages');
    if (!log) return;

    log.innerHTML = state.chat
      .map((message) => {
        if (message.role === 'user') {
          return `<div class="flex justify-end">
            <div class="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-500/15 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-emerald-50 ring-1 ring-inset ring-emerald-400/20">
              ${esc(message.text)}
            </div>
          </div>`;
        }
        if (message.role === 'system') {
          return `<p class="text-center text-[10px] uppercase tracking-[0.12em] text-slate-500">${esc(message.text)}</p>`;
        }
        if (message.pending) {
          return `<div class="flex gap-2">${chatAvatar()}
            <div class="chat-bubble-ai flex items-center gap-1">
              <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
              <span class="ml-1 text-[11px] text-slate-500">Reading the ledger…</span>
            </div>
          </div>`;
        }
        if (message.error) {
          return `<div class="flex gap-2">${chatAvatar()}
            <div class="chat-bubble-ai text-rose-200">${esc(message.text)}</div>
          </div>`;
        }
        const reply = message.reply;
        return `<div class="flex gap-2">${chatAvatar()}
          <div class="min-w-0 max-w-[calc(100%-2rem)] space-y-2">
            <div class="chat-bubble-ai">${esc(reply.intro)}</div>
            ${chatTable(reply.table)}
            ${chatVerdict(reply.verdict)}
            ${reply.meta ? `<p class="px-0.5 text-[9.5px] uppercase tracking-[0.1em] text-slate-600">${esc(reply.meta)}</p>` : ''}
          </div>
        </div>`;
      })
      .join('');

    log.scrollTop = log.scrollHeight;

    const lastReply = [...state.chat].reverse().find((message) => message.role === 'ai' && message.reply);
    const chips = lastReply?.reply?.chips || [];
    const chipSlot = $('#chat-chips');
    if (chipSlot) {
      chipSlot.innerHTML = chips
        .map(
          (chip) => `<button type="button" class="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10.5px] font-medium text-slate-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200"
            data-chat-chip="${esc(chip)}">${esc(chip)}</button>`,
        )
        .join('');
    }
  }


  function setChatOpen(open) {
    state.chatOpen = open;
    const widget = $('#chat-widget');
    const fab = $('#chat-fab');
    if (widget) widget.classList.toggle('hidden', !open);
    if (fab) fab.classList.toggle('hidden', open);
    if (open) {
      renderChat();
      const badge = fab?.querySelector('span');
      if (badge) badge.classList.add('hidden');
      const input = $('#chat-input');
      if (input && window.innerWidth >= 640) window.setTimeout(() => input.focus(), 80);
    }
  }

  function pushChat(message) {
    state.chat.push(message);
    renderChat();
  }

  function autoGrow(input) {
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
  }

  async function sendChat(rawMessage) {
    const message = String(rawMessage || '').trim();
    if (!message) return;
    setChatOpen(true);
    pushChat({ role: 'user', text: message });
    const pending = { role: 'ai', pending: true };
    pushChat(pending);
    const input = $('#chat-input');
    if (input) {
      input.value = '';
      autoGrow(input);
    }

    try {
      const data = await api('/api/assistant/query', {
        method: 'POST',
        body: { message, location: state.location },
      });
      state.chat = state.chat.filter((entry) => entry !== pending);
      state.chat.push({ role: 'ai', reply: data.reply, text: data.reply?.intro || '' });
      renderChat();
    } catch (error) {
      state.chat = state.chat.filter((entry) => entry !== pending);
      state.chat.push({ role: 'ai', error: true, text: `I could not reach the finance engine: ${error.message}` });
      renderChat();
    }
  }


  function openDrawer(alertId) {
    const alert = state.dashboard?.alerts.find((item) => item.id === alertId);
    if (!alert) return;
    const drawer = $('#alert-drawer');
    const panel = $('#drawer-panel');
    if (!drawer || !panel) return;

    const severity = SEVERITY[alert.severity] || SEVERITY.low;
    state.drawerReturnFocus = document.activeElement;
    state.openAlert = alert.id;

    panel.innerHTML = `
      <div class="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div class="min-w-0">
          <p class="label">Discrepancy detail</p>
          <h2 id="drawer-title" class="mt-1 text-[15px] font-semibold leading-snug text-white">${esc(alert.title)}</h2>
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <span class="chip ${severity.chip}">${severity.label} severity</span>
            <span class="chip bg-white/[0.04] text-slate-400">${esc(alert.department)}</span>
            <span class="chip bg-white/[0.04] text-slate-400">${alert.confidence}% confidence</span>
          </div>
        </div>
        <button type="button" id="drawer-close" class="icon-btn shrink-0" data-action="close-drawer" aria-label="Close discrepancy detail">
          ${icon('close', 'h-4 w-4')}
        </button>
      </div>

      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div class="rounded-xl border ${severity.border} bg-gradient-to-br ${severity.card} to-slate-900/40 px-3.5 py-3">
          <p class="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">${esc(alert.impact.label)}</p>
          <p class="mt-1 text-2xl font-semibold ${severity.text} tabular">${money(alert.impact.amount, { compact: 'auto' })}</p>
          <p class="mt-1 text-[10.5px] text-slate-500">${esc(alert.property)} · detected ${esc(alert.detectedAt)}</p>
        </div>

        <div>
          <p class="label">What the AI saw</p>
          <p class="mt-1.5 text-[12.5px] leading-relaxed text-gray-300">${esc(alert.summary)}</p>
        </div>

        <div>
          <p class="label">Evidence chain</p>
          <ul class="mt-2 space-y-1.5">
            ${alert.evidence
              .map((item, index) => {
                const entry = typeof item === 'string' ? { label: item, value: '', tone: 'neutral' } : item;
                const tone =
                  entry.tone === 'danger'
                    ? 'text-rose-300'
                    : entry.tone === 'warning'
                      ? 'text-amber-300'
                      : 'text-gray-100';
                return `<li class="flex items-start gap-2 rounded-lg bg-white/[0.025] px-2.5 py-2">
                  <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-700/60 text-[9px] font-semibold text-slate-300 tabular">${index + 1}</span>
                  <span class="flex min-w-0 flex-1 items-baseline justify-between gap-2 text-[11.5px] leading-relaxed">
                    <span class="min-w-0 text-slate-400">${esc(entry.label)}</span>
                    ${entry.value ? `<span class="shrink-0 font-medium ${tone} tabular">${esc(entry.value)}</span>` : ''}
                  </span>
                </li>`;
              })
              .join('')}
          </ul>
        </div>

        <div>
          <p class="label">Recommended next step</p>
          <p class="mt-1.5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-emerald-100">
            <span class="mt-px shrink-0 text-emerald-300">${icon('sparkles', 'h-3.5 w-3.5')}</span>
            <span>${esc(alert.recommendation)}</span>
          </p>
        </div>

        <dl class="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px]">
          <div class="flex items-center justify-between gap-3"><dt class="text-slate-500">Source</dt><dd class="text-right font-medium text-gray-200">${esc(alert.source)}</dd></div>
          <div class="flex items-center justify-between gap-3"><dt class="text-slate-500">Rule</dt><dd class="text-right font-medium text-gray-200">${esc(alert.meta)}</dd></div>
          <div class="flex items-center justify-between gap-3"><dt class="text-slate-500">Status</dt><dd class="text-right font-medium ${alert.trained ? 'text-emerald-300' : 'text-amber-300'}">${alert.trained ? 'Expected · AI trained' : 'Open · awaiting decision'}</dd></div>
        </dl>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 bg-slate-900/60 px-5 py-3.5">
        ${
          alert.trained
            ? `<span class="flex items-center gap-1.5 text-[11.5px] text-emerald-300">${icon('check', 'h-4 w-4')} Trained as expected · hidden from open flags</span>`
            : `<button type="button" class="btn-primary flex-1" data-action="train" data-alert-id="${esc(alert.id)}">
                ${icon('sparkles', 'h-3.5 w-3.5')} Mark expected &amp; train AI
              </button>`
        }
        <button type="button" class="btn" data-action="ask-alert" data-alert-id="${esc(alert.id)}">Ask AI</button>
      </div>`;

    drawer.classList.remove('hidden');
    drawer.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    $('#drawer-close')?.focus();
  }

  function closeDrawer() {
    const drawer = $('#alert-drawer');
    if (!drawer || drawer.classList.contains('hidden')) return;
    drawer.classList.add('hidden');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.openAlert = null;
    if (state.drawerReturnFocus && typeof state.drawerReturnFocus.focus === 'function') {
      state.drawerReturnFocus.focus();
    }
  }


  function buildSearchIndex() {
    const { departments, alerts, locations } = state.dashboard;
    const index = [];

    Object.entries(VIEW_META).forEach(([view, meta]) => {
      if (view === 'revenue') return;
      index.push({ group: 'Section', label: meta.title, hint: 'Open workspace section', action: { view }, icon: 'compass' });
    });

    departments.forEach((department) =>
      index.push({
        group: 'Department',
        label: department.name,
        hint: `${money(department.net, { compact: 'auto' })} net · ${pct(department.margin)} margin`,
        action: { view: 'revenue', department: department.id },
        icon: department.icon,
      }),
    );

    alerts.forEach((alert) =>
      index.push({
        group: 'Discrepancy',
        label: alert.title,
        hint: `${alert.department} · ${alert.impactLabel} · ${alert.severity} severity`,
        action: { alertId: alert.id },
        icon: 'alert',
      }),
    );

    locations.forEach((location) =>
      index.push({
        group: 'Context',
        label: `Switch to ${location.label}`,
        hint: `${location.region} · ${location.currency}`,
        action: { location: location.id },
        icon: 'globe',
      }),
    );

    index.push({
      group: 'Assistant',
      label: 'Ask the AI assistant',
      hint: 'Open chat with a finance prompt',
      action: { chat: 'What should I review first?' },
      icon: 'sparkles',
    });

    return index;
  }

  function closeSearch() {
    const panel = $('#search-results');
    const input = $('#search-input');
    if (panel) panel.classList.add('hidden');
    if (input) {
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    state.searchResults = [];
    state.searchCursor = 0;
  }

  function paintSearchCursor() {
    $$('#search-results [data-search-index]').forEach((option, index) => {
      const active = index === state.searchCursor;
      option.setAttribute('aria-selected', String(active));
      option.classList.toggle('bg-white/[0.07]', active);
      option.classList.toggle('hover:bg-white/[0.05]', !active);
      if (active) {
        $('#search-input')?.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function renderSearch(rawQuery) {
    const input = $('#search-input');
    const panel = $('#search-results');
    if (!input || !panel) return;
    const query = String(rawQuery || '').trim();
    if (!query) {
      closeSearch();
      return;
    }

    const term = query.toLowerCase();
    state.searchResults = (state.searchIndex || [])
      .filter((item) => `${item.label} ${item.hint} ${item.group}`.toLowerCase().includes(term))
      .slice(0, 8);
    state.searchCursor = 0;

    panel.innerHTML = state.searchResults.length
      ? state.searchResults
          .map(
            (item, index) => `<button type="button" role="option" id="search-option-${index}" data-search-index="${index}"
              aria-selected="${index === 0}"
              class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                index === 0 ? 'bg-white/[0.07]' : 'hover:bg-white/[0.05]'
              }">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400">${icon(item.icon, 'h-3.5 w-3.5')}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[12px] font-medium text-gray-200">${esc(item.label)}</span>
                <span class="block truncate text-[10px] text-slate-500">${esc(item.hint)}</span>
              </span>
              <span class="chip shrink-0 bg-white/[0.04] text-slate-500">${esc(item.group)}</span>
            </button>`,
          )
          .join('')
      : `<p class="px-3 py-6 text-center text-[11.5px] leading-relaxed text-slate-500">
          No matches for <span class="text-gray-300">“${esc(query)}”</span>.<br />Try “bar”, “sync”, “Nairobi” or “margin”.
        </p>`;

    panel.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
    paintSearchCursor();
  }

  function activateSearchResult(index) {
    const item = state.searchResults[index];
    if (!item) return;
    const action = item.action;
    closeSearch();
    const input = $('#search-input');
    if (input) input.value = '';
    if (action.alertId) openDrawer(action.alertId);
    else if (action.location) switchLocation(action.location);
    else if (action.chat) sendChat(action.chat);
    else if (action.view) setView(action.view, { department: action.department });
  }



  function toggleLocationMenu(force) {
    const menu = $('#location-menu');
    const button = $('#location-button');
    const chevron = $('#location-chevron');
    if (!menu) return;
    const open = typeof force === 'boolean' ? force : menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !open);
    button?.setAttribute('aria-expanded', String(open));
    if (chevron) chevron.classList.toggle('rotate-180', open);
  }

  function openSidebar() {
    const sidebar = $('#sidebar');
    const overlay = $('#sidebar-overlay');
    const button = $('#menu-button');
    if (!sidebar) return;
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    overlay?.classList.remove('hidden');
    button?.setAttribute('aria-expanded', 'true');
    if (window.innerWidth < 1024) document.body.style.overflow = 'hidden';
  }

  function toggleNotifications(force) {
    const menu = $('#notification-menu');
    const button = $('#bell-button');
    const dot = $('#notification-dot');
    if (!menu) return;
    const open = typeof force === 'boolean' ? force : menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !open);
    button?.setAttribute('aria-expanded', String(open));
    if (open && dot) dot.classList.add('hidden');
    if (open) toggleLocationMenu(false);
  }

  function toggleRevenueNav(force) {
    const subnav = $('#revenue-subnav');
    const button = $('#revenue-toggle');
    if (!subnav) return;
    const open = typeof force === 'boolean' ? force : subnav.classList.contains('hidden');
    subnav.classList.toggle('hidden', !open);
    button?.setAttribute('aria-expanded', String(open));
    button?.classList.toggle('text-gray-100', open);
  }

  async function switchLocation(locationId) {
    if (!state.dashboard || locationId === state.location) {
      toggleLocationMenu(false);
      return;
    }
    toggleLocationMenu(false);
    state.location = locationId;
    const payload = await loadDashboard();
    if (payload) {
      toast(`Context switched to ${payload.location.label} · ${payload.currency}`, 'info');
      if (state.chat.length) {
        pushChat({ role: 'system', text: `Context: ${payload.location.label} · ${payload.currency}` });
      }
    }
  }

  function renderAll() {
    renderLocationContext();
    renderBrief();
    renderKpis();
    renderHealth();
    renderAlerts();
    renderRevenue();
    renderSync();
    renderSettings();
    renderSyncStamps();
    updateClock();
    if (state.chat.length) renderChat();
    if (state.view === 'ledger') loadLedger();
  }

  async function loadDashboard() {
    try {
      const payload = await api(`/api/dashboard?location=${encodeURIComponent(state.location)}`);
      state.dashboard = payload;
      state.location = payload.location.id;
      if (!payload.departments.some((department) => department.id === state.department)) {
        state.department = payload.departments[0]?.id || 'rooms';
      }
      if (!payload.alerts.some((alert) => alert.id === state.openAlert)) state.openAlert = null;
      state.ledger = null;
      state.ledgerPage = 1;
      state.searchIndex = buildSearchIndex();
      renderAll();
      document.title = `${VIEW_META[state.view].title} · Mad Vervet Hostels`;
      return payload;
    } catch (error) {
      toast(`Could not load dashboard: ${error.message}`, 'error');
      return null;
    }
  }

  function briefText() {
    const { brief, location } = state.dashboard;
    const body = brief.segments.map((segment) => segment.text).join(' ');
    const signals = brief.signals
      .map((signal, index) => `${index + 1}. ${signal.label}: ${signal.value} — ${signal.note}`)
      .join('\n');
    return [
      `MAD VERVET HOSTELS · MORNING BRIEF · ${location.label}`,
      `Generated ${brief.generatedAt} · ${brief.confidence}% confidence`,
      '',
      body,
      '',
      'SIGNALS',
      signals,
    ].join('\n');
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', 'readonly');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      toast(successMessage);
    } catch (error) {
      toast('Clipboard is unavailable in this browser', 'error');
    }
  }

  function exportCsv() {
    if (!state.dashboard) return;
    const rows = [
      ['Department', 'Gross', 'Expenses', 'Net', 'Margin %', 'Delta %'],
      ...state.dashboard.departments.map((department) => [
        department.name,
        department.gross,
        department.expenses,
        department.net,
        department.margin,
        department.delta,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mad-vervet-${state.location}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Exported ${state.dashboard.departments.length} departments · ${state.dashboard.currency}`);
  }

  async function runSync(node) {
    if (state.busy) return;
    state.busy = true;
    node?.setAttribute('aria-busy', 'true');
    node?.classList.add('opacity-70');
    try {
      const result = await api('/api/sync', { method: 'POST', body: { location: state.location } });
      await loadDashboard();
      toast(`PMS synced · ${Number(result.records).toLocaleString('en-US')} records · ${result.conflicts} conflicts`);
    } catch (error) {
      toast(`Sync failed: ${error.message}`, 'error');
    } finally {
      state.busy = false;
      node?.removeAttribute('aria-busy');
      node?.classList.remove('opacity-70');
    }
  }

  async function trainAlert(alertId) {
    if (!alertId) return;
    try {
      const result = await api(`/api/alerts/${encodeURIComponent(alertId)}/expect`, {
        method: 'POST',
        body: { location: state.location, reason: 'Confirmed expected by executive' },
      });
      closeDrawer();
      await loadDashboard();
      toast(`Pattern learned · ${result.trainedPatterns} trained this session`);
      pushChat({
        role: 'system',
        text: `Trained: ${result.entry?.title || 'discrepancy'} · ${result.trainedPatterns} patterns in memory`,
      });
    } catch (error) {
      toast(`Could not train model: ${error.message}`, 'error');
    }
  }

  async function resetTraining() {
    try {
      await api('/api/training/reset', { method: 'POST' });
      await loadDashboard();
      toast('AI training memory cleared', 'info');
    } catch (error) {
      toast(`Could not reset training: ${error.message}`, 'error');
    }
  }


  async function handleAction(action, node) {
    if (!action) return;
    const alertId = node?.dataset?.alertId;

    if (action === 'ledger-export') {
      ledgerCsv();
      return;
    }
    if (action === 'ledger-reset') {
      resetLedgerFilters();
      return;
    }
    if (action === 'ledger-prev') {
      setLedgerPage(state.ledgerPage - 1);
      return;
    }
    if (action === 'ledger-next') {
      setLedgerPage(state.ledgerPage + 1);
      return;
    }

    if (action === 'export') {
      exportCsv();
      return;
    }
    if (action === 'sync' || action === 'force-sync') {
      await runSync(node);
      return;
    }
    if (action === 'brief-copy') {
      await copyText(briefText(), 'Morning brief copied to clipboard');
      return;
    }
    if (action === 'brief-refresh') {
      await loadDashboard();
      toast('Morning brief refreshed from the latest PMS pull', 'info');
      return;
    }
    if (action === 'ask-brief') {
      sendChat('Walk me through this morning brief and what needs my attention.');
      return;
    }
    if (action === 'ask-alert') {
      const alert = state.dashboard?.alerts.find((item) => item.id === alertId);
      closeDrawer();
      setChatOpen(true);
      sendChat(
        alert
          ? `Why was "${alert.title}" flagged, and what should I do about the ${money(alert.impact.amount, { compact: 'auto' })} exposure?`
          : 'Explain the open discrepancies and what needs my attention.',
      );
      return;
    }
    if (action === 'ask-dept') {
      const department = state.dashboard?.departments.find((item) => item.id === state.department);
      sendChat(`Break down ${department?.name || 'revenue'} performance for yesterday.`);
      return;
    }
    if (action === 'investigate') {
      openDrawer(alertId);
      return;
    }
    if (action === 'train') {
      await trainAlert(alertId);
      return;
    }
    if (action === 'reset-training') {
      await resetTraining();
      return;
    }
    if (action === 'save-settings') {
      saveSettings({});
      renderSettings();
      toast('AI preferences saved to this workspace');
      return;
    }
    if (action === 'close-drawer') {
      closeDrawer();
      return;
    }
    if (action === 'all-alerts') {
      setView('summary', { scroll: false });
      state.alertFilter = 'all';
      $$('[data-alert-filter]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.alertFilter === 'all'));
      });
      renderAlerts();
      toggleNotifications(false);
      $('#alerts-feed')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (action === 'profile') {
      toast('Profile switching is mocked in this prototype', 'info');
      return;
    }
    toast(`“${action}” is not wired to an action yet`, 'info');
  }


  function handleNotification(kind) {
    toggleNotifications(false);
    if (kind === 'sync') {
      setView('sync');
      return;
    }
    if (kind === 'brief') {
      setView('summary', { scroll: false });
      $('#brief-slot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setView('summary', { scroll: false });
    const alert = state.dashboard?.alerts.find((item) => item.severity === 'high');
    if (alert) openDrawer(alert.id);
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (!target.closest('#location-menu') && !target.closest('#location-button')) toggleLocationMenu(false);
      if (!target.closest('#notification-menu') && !target.closest('#bell-button')) toggleNotifications(false);
      if (!target.closest('#search-results') && target.id !== 'search-input') closeSearch();

      const searchOption = target.closest('[data-search-index]');
      if (searchOption) {
        activateSearchResult(Number(searchOption.dataset.searchIndex));
        return;
      }

      if (target.closest('#menu-button')) {
        openSidebar();
        return;
      }
      if (target.closest('#sidebar-overlay')) {
        closeSidebar();
        return;
      }
      if (target.closest('#location-button')) {
        toggleLocationMenu();
        return;
      }
      if (target.closest('#bell-button')) {
        toggleNotifications();
        return;
      }
      if (target.closest('#revenue-toggle')) {
        toggleRevenueNav();
        return;
      }

      const locationItem = target.closest('[data-location]');
      if (locationItem) {
        switchLocation(locationItem.dataset.location);
        return;
      }

      const viewTrigger = target.closest('[data-view]:not(section)');
      if (viewTrigger) {
        setView(viewTrigger.dataset.view, { department: viewTrigger.dataset.department });
        return;
      }

      const filterTrigger = target.closest('[data-alert-filter]');
      if (filterTrigger) {
        state.alertFilter = filterTrigger.dataset.alertFilter;
        $$('[data-alert-filter]').forEach((button) => {
          button.setAttribute('aria-pressed', String(button.dataset.alertFilter === state.alertFilter));
        });
        renderAlerts();
        return;
      }

      const departmentPill = target.closest('[data-department-pill]');
      if (departmentPill) {
        setView('revenue', { department: departmentPill.dataset.departmentPill });
        return;
      }

      const chatChip = target.closest('[data-chat-chip]');
      if (chatChip) {
        sendChat(chatChip.dataset.chatChip);
        return;
      }

      const notification = target.closest('[data-notification]');
      if (notification) {
        handleNotification(notification.dataset.notification);
        return;
      }

      const ledgerSort = target.closest('[data-ledger-sort]');
      if (ledgerSort) {
        event.preventDefault();
        toggleLedgerSort(ledgerSort.dataset.ledgerSort);
        return;
      }

      const ledgerDirection = target.closest('[data-ledger-direction]');
      if (ledgerDirection) {
        event.preventDefault();
        state.ledgerFilters.direction = ledgerDirection.dataset.ledgerDirection;
        state.ledgerPage = 1;
        paintLedger();
        return;
      }

      const actionNode = target.closest('[data-action]');
      if (actionNode) {
        event.preventDefault();
        handleAction(actionNode.dataset.action, actionNode);
        return;
      }

      const alertLink = target.closest('[data-alert-id]');
      if (alertLink) {
        openDrawer(alertLink.dataset.alertId);
        return;
      }

      if (target.closest('#chat-fab')) {
        setChatOpen(true);
        return;
      }
      if (target.closest('#chat-minimize') || target.closest('#chat-close')) {
        setChatOpen(false);
        return;
      }
    });


    document.addEventListener('change', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const ledgerFilter = target ? target.closest('[data-ledger-filter]') : null;
      if (ledgerFilter) {
        state.ledgerFilters[ledgerFilter.dataset.ledgerFilter] = ledgerFilter.value;
        state.ledgerPage = 1;
        paintLedger();
        return;
      }
      if (target && target.id === 'ledger-page-size') {
        state.ledgerPageSize = Number(target.value) || 25;
        state.ledgerPage = 1;
        paintLedger();
        return;
      }
      const pref = target ? target.closest('[data-pref]') : null;
      if (!pref) return;
      saveSettings({ [pref.dataset.pref]: pref.checked });
    });

    document.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof Element) || target.id !== 'ledger-search') return;
      state.ledgerFilters.query = target.value;
      state.ledgerPage = 1;
      paintLedger();
    });

    const chatForm = $('#chat-form');
    chatForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      sendChat($('#chat-input')?.value || '');
    });

    const chatInput = $('#chat-input');
    chatInput?.addEventListener('input', () => autoGrow(chatInput));
    chatInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChat(chatInput.value);
      }
    });

    const searchInput = $('#search-input');
    searchInput?.addEventListener('input', (event) => renderSearch(event.target.value));
    searchInput?.addEventListener('focus', (event) => {
      if (event.target.value.trim()) renderSearch(event.target.value);
    });
    searchInput?.addEventListener('keydown', (event) => {
      const count = state.searchResults.length;
      if (event.key === 'ArrowDown' && count) {
        event.preventDefault();
        state.searchCursor = (state.searchCursor + 1) % count;
        paintSearchCursor();
      } else if (event.key === 'ArrowUp' && count) {
        event.preventDefault();
        state.searchCursor = (state.searchCursor - 1 + count) % count;
        paintSearchCursor();
      } else if (event.key === 'Enter' && count) {
        event.preventDefault();
        activateSearchResult(state.searchCursor);
      } else if (event.key === 'Escape') {
        searchInput.value = '';
        closeSearch();
        searchInput.blur();
      }
    });

    document.addEventListener('keydown', (event) => {
      const active = document.activeElement;
      const editing =
        /^(INPUT|TEXTAREA|SELECT)$/.test(active?.tagName || '') || Boolean(active?.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = $('#search-input');
        input?.focus();
        input?.select();
        if (input?.value.trim()) renderSearch(input.value);
        return;
      }
      if (event.key === 'Escape') {
        closeSearch();
        toggleLocationMenu(false);
        toggleNotifications(false);
        closeSidebar();
        closeDrawer();
        return;
      }
      if (event.key === '/' && !editing) {
        event.preventDefault();
        $('#search-input')?.focus();
      }
    });

    $('#drawer-backdrop')?.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const drawer = $('#alert-drawer');
      if (!drawer || drawer.classList.contains('hidden')) return;
      const focusable = $$(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        drawer,
      ).filter((node) => !node.disabled && node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) return;
      $('#sidebar-overlay')?.classList.add('hidden');
      $('#sidebar')?.classList.remove('-translate-x-full');
      const drawer = $('#alert-drawer');
      if (!drawer || drawer.classList.contains('hidden')) document.body.style.overflow = '';
    });
  }

  function seedChat() {
    const { location, totals, health, brief, sync } = state.dashboard;
    const margin = totals.gross ? (totals.net / totals.gross) * 100 : 0;
    pushChat({
      role: 'system',
      text: `${location.label} · ${location.currency} · synced ${relativeTime(sync.lastSync)}`,
    });
    pushChat({
      role: 'ai',
      reply: {
        intro: `Good morning Amara. ${location.label} closed at ${money(totals.net, { compact: 'auto' })} net (${pct(
          margin,
        )} margin) on ${money(totals.gross, { compact: 'auto' })} gross, and financial health sits at ${health.score}/100. ${
          brief.segments[0]?.text || 'Two signals are worth your attention before the 09:00 stand-up.'
        }`,
        table: null,
        verdict: null,
        chips: ['Summarise yesterday for me', 'Which margins are weakest?', 'List open discrepancies'],
        meta: 'verve-fin-v3 · grounded in the morning PMS snapshot',
      },
      text: 'Morning brief',
    });
  }

  function init() {
    loadSettings();
    bindEvents();
    updateClock();

    loadDashboard().then((payload) => {
      if (!payload) return;
      seedChat();
      setChatOpen(false);
    });

    window.setInterval(() => {
      updateClock();
      renderSyncStamps();
    }, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

