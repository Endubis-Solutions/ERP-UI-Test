'use strict';

/**
 * Mock PMS aggregation layer.
 * In production these structures are produced by the sync worker that reads
 * Opera (reservations), Lightspeed (POS), MarketMan (inventory) and Sage (ledger).
 */

const LOCATIONS = [
  {
    id: 'global',
    label: 'Global',
    region: 'Consolidated · 3 properties',
    currency: 'USD',
    timezone: 'Africa/Addis_Ababa',
    tzLabel: 'EAT',
  },
  {
    id: 'addis',
    label: 'Addis Ababa',
    region: 'Bole · 128 rooms',
    currency: 'ETB',
    timezone: 'Africa/Addis_Ababa',
    tzLabel: 'EAT',
  },
  {
    id: 'nairobi',
    label: 'Nairobi',
    region: 'Westlands · 96 rooms',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    tzLabel: 'EAT',
  },
];

const DEPARTMENTS = {
  global: [
    {
      id: 'rooms',
      name: 'Rooms',
      icon: 'bed',
      accent: 'sky',
      meta: '284 keys · 82% occupancy',
      gross: 48250,
      expenses: 12840,
      delta: 8.2,
      trend: [31, 35, 33, 38, 36, 41, 44],
    },
    {
      id: 'bar',
      name: 'Bar',
      icon: 'wine',
      accent: 'amber',
      meta: '2 outlets · 6,412 covers',
      gross: 21480,
      expenses: 8930,
      delta: 3.1,
      trend: [12, 15, 14, 13, 17, 16, 19],
    },
    {
      id: 'restaurant',
      name: 'Restaurant',
      icon: 'utensils',
      accent: 'orange',
      meta: '3 kitchens · food cost 42.8%',
      gross: 18640,
      expenses: 9120,
      delta: -2.4,
      trend: [14, 12, 15, 13, 11, 14, 13],
    },
    {
      id: 'events',
      name: 'Events',
      icon: 'sparkles',
      accent: 'violet',
      meta: '4 events · 1,240 guests',
      gross: 32900,
      expenses: 19300,
      delta: 12.6,
      trend: [8, 14, 9, 18, 12, 26, 31],
    },
    {
      id: 'laundry',
      name: 'Laundry',
      icon: 'shirt',
      accent: 'cyan',
      meta: 'On-demand · 1,840 kg',
      gross: 6420,
      expenses: 2180,
      delta: 1.4,
      trend: [4, 4.6, 4.2, 5.1, 4.8, 5.4, 6],
    },
    {
      id: 'tours',
      name: 'Tours',
      icon: 'compass',
      accent: 'emerald',
      meta: '12 departures · 96 pax',
      gross: 9860,
      expenses: 3420,
      delta: 4.7,
      trend: [6, 5.4, 6.8, 6.1, 7.2, 7.8, 8.4],
    },
  ],
  addis: [
    {
      id: 'rooms',
      name: 'Rooms',
      icon: 'bed',
      accent: 'sky',
      meta: '128 keys · 79% occupancy',
      gross: 2640000,
      expenses: 720000,
      delta: 5.4,
      trend: [31, 34, 32, 36, 35, 38, 40],
    },
    {
      id: 'bar',
      name: 'Bar',
      icon: 'wine',
      accent: 'amber',
      meta: 'Sky lounge · 2,108 covers',
      gross: 1120000,
      expenses: 486000,
      delta: 2.2,
      trend: [11, 13, 12, 12, 15, 14, 16],
    },
    {
      id: 'restaurant',
      name: 'Restaurant',
      icon: 'utensils',
      accent: 'orange',
      meta: '1 kitchen · food cost 41.6%',
      gross: 968000,
      expenses: 412000,
      delta: -1.8,
      trend: [12, 11, 13, 11, 10, 12, 11],
    },
    {
      id: 'events',
      name: 'Events',
      icon: 'sparkles',
      accent: 'violet',
      meta: '2 events · 410 guests',
      gross: 742000,
      expenses: 398000,
      delta: 9.1,
      trend: [7, 9, 8, 12, 10, 15, 18],
    },
    {
      id: 'laundry',
      name: 'Laundry',
      icon: 'shirt',
      accent: 'cyan',
      meta: 'On-demand · 640 kg',
      gross: 318000,
      expenses: 121000,
      delta: 0.8,
      trend: [4, 4.2, 4.1, 4.6, 4.4, 4.9, 5.2],
    },
    {
      id: 'tours',
      name: 'Tours',
      icon: 'compass',
      accent: 'emerald',
      meta: '5 departures · 38 pax',
      gross: 486000,
      expenses: 168000,
      delta: 6.4,
      trend: [5, 4.6, 5.8, 5.2, 6.4, 6.9, 7.4],
    },
  ],
  nairobi: [
    {
      id: 'rooms',
      name: 'Rooms',
      icon: 'bed',
      accent: 'sky',
      meta: '96 keys · 88% occupancy',
      gross: 4820000,
      expenses: 1240000,
      delta: 9.6,
      trend: [30, 33, 36, 34, 40, 42, 47],
    },
    {
      id: 'bar',
      name: 'Bar',
      icon: 'wine',
      accent: 'amber',
      meta: 'Rooftop · 3,204 covers',
      gross: 1960000,
      expenses: 812000,
      delta: 4.3,
      trend: [12, 14, 13, 15, 18, 17, 21],
    },
    {
      id: 'restaurant',
      name: 'Restaurant',
      icon: 'utensils',
      accent: 'orange',
      meta: '2 kitchens · food cost 38.4%',
      gross: 1610000,
      expenses: 942000,
      delta: 1.2,
      trend: [13, 12, 14, 13, 12, 15, 14],
    },
    {
      id: 'events',
      name: 'Events',
      icon: 'sparkles',
      accent: 'violet',
      meta: 'DJ night · 412 tickets',
      gross: 1480000,
      expenses: 986000,
      delta: 18.4,
      trend: [6, 9, 7, 12, 9, 19, 28],
    },
    {
      id: 'laundry',
      name: 'Laundry',
      icon: 'shirt',
      accent: 'cyan',
      meta: 'On-demand · 820 kg',
      gross: 486000,
      expenses: 172000,
      delta: 2.6,
      trend: [4, 4.4, 4.1, 4.8, 5.0, 5.6, 6.1],
    },
    {
      id: 'tours',
      name: 'Tours',
      icon: 'compass',
      accent: 'emerald',
      meta: '4 departures · 42 pax',
      gross: 742000,
      expenses: 268000,
      delta: 7.8,
      trend: [5, 5.6, 6.1, 5.8, 6.9, 7.4, 8.1],
    },
  ],
};

/**
 * Raw posting templates: the individual lines a PMS / POS / supplier-ledger export
 * would produce for one department-day. `weight` splits the department's gross
 * (income lines) or expenses (expense lines) so the ledger always reconciles.
 */
const LEDGER_TEMPLATES = {
  rooms: {
    income: [
      { category: 'Room revenue', description: 'Direct bookings - 64 room nights', source: 'Opera PMS', method: 'Card', weight: 0.34 },
      { category: 'Room revenue', description: 'OTA bookings - 92 room nights', source: 'Booking.com', method: 'Virtual card', weight: 0.31 },
      { category: 'Room revenue', description: 'Corporate rate block - 38 room nights', source: 'Opera PMS', method: 'Invoice', weight: 0.19 },
      { category: 'Room extras', description: 'Late checkout, upgrades and no-show fees', source: 'Opera PMS', method: 'Card', weight: 0.11 },
      { category: 'Room extras', description: 'Damage waiver and key replacement', source: 'Opera PMS', method: 'Cash', weight: 0.05 },
    ],
    expense: [
      { category: 'Payroll', description: 'Housekeeping and front desk payroll', source: 'Sage', method: 'Bank transfer', weight: 0.46 },
      {
        category: 'OTA commission',
        description: 'Booking.com commission - 92 room nights',
        source: 'Booking.com',
        method: 'Invoice',
        status: 'pending',
        note: 'Awaiting monthly statement',
        weight: 0.21,
      },
      { category: 'Supplies', description: 'Linen, amenities and cleaning supplies', source: 'MarketMan', method: 'Card', weight: 0.15 },
      { category: 'Utilities', description: 'Electricity and water allocation', source: 'Sage', method: 'Bank transfer', weight: 0.12 },
      { category: 'Maintenance', description: 'AC servicing and plumbing repairs', source: 'Sage', method: 'Card', weight: 0.06 },
    ],
  },
  bar: {
    income: [
      { category: 'Bar sales', description: 'Card sales - sky lounge and pool bar', source: 'Lightspeed POS', method: 'Card', weight: 0.48 },
      { category: 'Bar sales', description: 'Cash sales - both outlets', source: 'Lightspeed POS', method: 'Cash', weight: 0.22 },
      { category: 'Bar sales', description: 'Room charge transfers from guests', source: 'Lightspeed POS', method: 'Room charge', weight: 0.18 },
      { category: 'Bar events', description: 'Private bar tab - corporate mixer', source: 'Lightspeed POS', method: 'Invoice', weight: 0.12 },
    ],
    expense: [
      { category: 'Beverage cost', description: 'Beer, wine and spirits replenishment', source: 'MarketMan', method: 'Bank transfer', weight: 0.58 },
      { category: 'Payroll', description: 'Bar staff and sommelier payroll', source: 'Sage', method: 'Bank transfer', weight: 0.26 },
      { category: 'Consumables', description: 'Glassware, ice and garnishes', source: 'MarketMan', method: 'Card', weight: 0.1 },
      { category: 'Waste', description: 'Spillage and breakage write-off', source: 'Sage', method: 'Journal', weight: 0.06 },
    ],
  },
  restaurant: {
    income: [
      { category: 'Food revenue', description: 'A la carte - lunch and dinner covers', source: 'Lightspeed POS', method: 'Card', weight: 0.44 },
      { category: 'Food revenue', description: 'Breakfast package - in-house guests', source: 'Opera PMS', method: 'Room charge', weight: 0.28 },
      { category: 'Food revenue', description: 'Cash covers and tips allocation', source: 'Lightspeed POS', method: 'Cash', weight: 0.16 },
      { category: 'Room service', description: 'Room service and minibar transfers', source: 'Opera PMS', method: 'Room charge', weight: 0.12 },
    ],
    expense: [
      { category: 'Food cost', description: 'Protein, produce and dry goods', source: 'MarketMan', method: 'Bank transfer', weight: 0.52 },
      { category: 'Payroll', description: 'Kitchen and service payroll', source: 'Sage', method: 'Bank transfer', weight: 0.28 },
      { category: 'Consumables', description: 'Packaging and small equipment', source: 'MarketMan', method: 'Card', weight: 0.12 },
      {
        category: 'Delivery commission',
        description: 'Delivery platform commission - 214 orders',
        source: 'Glovo',
        method: 'Invoice',
        status: 'pending',
        note: 'Statement due Friday',
        weight: 0.08,
      },
    ],
  },
  events: {
    income: [
      { category: 'Venue hire', description: 'Rooftop and courtyard hire', source: 'Opera PMS', method: 'Invoice', weight: 0.34 },
      { category: 'Ticketing', description: 'Ticketing - DJ night and live band', source: 'Stripe', method: 'Card', weight: 0.38 },
      { category: 'Catering', description: 'Catering attached to booked events', source: 'Lightspeed POS', method: 'Invoice', weight: 0.2 },
      { category: 'Production', description: 'AV, lighting and staging recharge', source: 'Sage', method: 'Invoice', weight: 0.08 },
    ],
    expense: [
      { category: 'Talent', description: 'Artist, DJ and MC fees', source: 'Sage', method: 'Bank transfer', weight: 0.4 },
      { category: 'Production', description: 'Sound, lighting and staging hire', source: 'Sage', method: 'Invoice', weight: 0.26 },
      { category: 'Security', description: 'Event security and ushers', source: 'Sage', method: 'Bank transfer', weight: 0.19 },
      { category: 'Marketing', description: 'Promoter fees and paid social', source: 'Meta Ads', method: 'Card', weight: 0.15 },
    ],
  },
  laundry: {
    income: [
      { category: 'Guest laundry', description: 'Guest laundry - 312 bags', source: 'Lightspeed POS', method: 'Card', weight: 0.46 },
      { category: 'Bulk contracts', description: 'Bulk linen contracts - 4 hostels', source: 'Opera PMS', method: 'Invoice', weight: 0.38 },
      { category: 'Express service', description: 'Express same-day surcharge', source: 'Lightspeed POS', method: 'Cash', weight: 0.16 },
    ],
    expense: [
      {
        category: 'Chemicals',
        description: 'Detergent and chemicals',
        source: 'MarketMan',
        method: 'Card',
        status: 'review',
        note: 'Receipt missing - awaiting upload',
        weight: 0.38,
      },
      { category: 'Payroll', description: 'Laundry attendants payroll', source: 'Sage', method: 'Bank transfer', weight: 0.34 },
      {
        category: 'Machine service',
        description: 'Machine servicing and parts',
        source: 'Sage',
        method: 'Card',
        status: 'review',
        note: 'Supplier invoice not matched',
        weight: 0.16,
      },
      { category: 'Utilities', description: 'Gas and water for laundry', source: 'Sage', method: 'Bank transfer', weight: 0.12 },
    ],
  },
  tours: {
    income: [
      { category: 'Tour bookings', description: 'City and mountain tours - direct', source: 'Stripe', method: 'Card', weight: 0.44 },
      { category: 'Tour bookings', description: 'OTA tour bookings', source: 'Viator', method: 'Virtual card', weight: 0.32 },
      { category: 'Transport', description: 'Airport transfers and day hires', source: 'Stripe', method: 'Cash', weight: 0.24 },
    ],
    expense: [
      { category: 'Guide fees', description: 'Freelance guide fees', source: 'Sage', method: 'Bank transfer', weight: 0.4 },
      { category: 'Park fees', description: 'Park entry and permits', source: 'Sage', method: 'Invoice', weight: 0.26 },
      { category: 'Transport', description: 'Vehicle fuel and driver allowance', source: 'Sage', method: 'Card', weight: 0.22 },
      {
        category: 'Commissions',
        description: 'OTA and agent commissions',
        source: 'Viator',
        method: 'Invoice',
        status: 'pending',
        note: 'Reconciling against payout report',
        weight: 0.12,
      },
    ],
  },
};

const LEDGER_PREFIX = { global: 'GL', addis: 'AD', nairobi: 'NB' };
const ledgerCache = new Map();

const BRIEFS = {
  global: {
    generatedAt: '06:12',
    confidence: 94,
    segments: [
      { text: 'Rooms brought in ' },
      { text: '$48,250', tone: 'stat' },
      { text: ' and the ' },
      {
        text: 'Events DJ night added $32,900',
        action: { type: 'view', view: 'revenue', department: 'events' },
      },
      { text: '. Three items need a decision before the 10:00 ops call: ' },
      {
        text: 'the Bar is 4 units short against POS',
        tone: 'danger',
        action: { type: 'alert', id: 'bar-units' },
      },
      { text: ', ' },
      {
        text: 'Restaurant food cost is running above the ceiling',
        tone: 'warn',
        action: { type: 'alert', id: 'restaurant-food-cost' },
      },
      { text: ', and ' },
      {
        text: '9 Laundry expenses are missing receipts',
        tone: 'danger',
        action: { type: 'alert', id: 'laundry-receipts' },
      },
      {
        text: '. Recommended action: backfill the PO on the Nairobi sound invoice and re-count the Bar after the 14:00 delivery.',
      },
    ],
  },
  addis: {
    generatedAt: '06:12',
    confidence: 96,
    segments: [
      { text: 'Rooms brought in ' },
      { text: 'ETB 2.64M', tone: 'stat' },
      { text: ', and the Sky lounge bar edged ahead of plan. Watch two things: ' },
      {
        text: 'food cost has crept above the ceiling',
        tone: 'warn',
        action: { type: 'alert', id: 'restaurant-food-cost' },
      },
      { text: ' after the produce supplier increase, and ' },
      {
        text: '2 tour deposits (ETB 44K) are unmatched in the bank feed',
        tone: 'warn',
        action: { type: 'alert', id: 'tour-deposits' },
      },
      { text: '. Bar looks clean — confirm the closing count sheet.' },
    ],
  },
  nairobi: {
    generatedAt: '06:12',
    confidence: 92,
    segments: [
      { text: 'Rooms carried ' },
      { text: 'KES 4.82M', tone: 'stat' },
      { text: ' and the ' },
      {
        text: 'DJ night added KES 618K in ticket sales',
        action: { type: 'view', view: 'revenue', department: 'events' },
      },
      { text: '. Two flags before close: the ' },
      {
        text: 'sound invoice is over quote with no PO',
        tone: 'warn',
        action: { type: 'alert', id: 'events-sound-invoice' },
      },
      { text: ', and ' },
      {
        text: '6 laundry expenses are missing receipts',
        tone: 'danger',
        action: { type: 'alert', id: 'laundry-receipts' },
      },
      { text: '. Bar shows a ' },
      {
        text: '4-unit shortfall vs POS',
        tone: 'danger',
        action: { type: 'alert', id: 'bar-units' },
      },
      { text: ' — likely the Saturday batch transfer, but it needs a signed count.' },
    ],
  },
};

/**
 * Yesterday's revenue expectation per location, used by the morning brief to say
 * whether trading finished above or below plan. Figures are in the location currency.
 */
const REVENUE_PLAN = {
  global: 131000,
  addis: 6400000,
  nairobi: 10400000,
};

const ALERTS = {
  global: [
    {
      id: 'bar-units',
      severity: 'high',
      department: 'Bar',
      property: 'Nairobi · Rooftop Bar',
      title: 'Bar inventory short by 4 units vs POS revenue',
      summary:
        'POS closed at 128 units sold, but the closing stock count reconciles to 132 units consumed. 4 premium spirit units ($1,240 at cost) are unaccounted for across the group.',
      meta: 'Bar · POS vs stock count',
      detectedAt: '07:42',
      confidence: 91,
      impact: { amount: 1240, label: 'Exposure' },
      evidence: [
        { label: 'POS units sold', value: '128 units', tone: 'neutral' },
        { label: 'Closing count', value: '132 units', tone: 'warning' },
        { label: 'Unit cost (weighted)', value: '$310', tone: 'neutral' },
        { label: 'Pattern', value: 'Recurs Fri / Sat', tone: 'danger' },
      ],
      recommendation:
        'Request the 22:00 closing count sheet from the Nairobi bar lead and compare it with the POS batch before adjusting stock. Same variance appeared twice this month.',
      source: 'Lightspeed POS × MarketMan',
    },
    {
      id: 'restaurant-food-cost',
      severity: 'medium',
      department: 'Restaurant',
      property: 'Group · 3 kitchens',
      title: 'Restaurant food cost exceeded 40% target',
      summary:
        'Food cost landed at 42.8% of restaurant revenue yesterday against the 40.0% board target — $610 over budget, driven by produce and dairy price increases at the Addis kitchen.',
      meta: 'Restaurant · cost control',
      detectedAt: '06:58',
      confidence: 88,
      impact: { amount: 610, label: 'Over budget' },
      evidence: [
        { label: 'Food cost', value: '42.8%', tone: 'warning' },
        { label: 'Board target', value: '40.0%', tone: 'neutral' },
        { label: '7-day average', value: '40.9%', tone: 'neutral' },
        { label: 'Largest driver', value: 'Addis produce +9.4%', tone: 'danger' },
      ],
      recommendation:
        'Reprice the three highest-volume mains or renegotiate the Addis produce contract before the weekend menu reset.',
      source: 'MarketMan × Sage ledger',
    },
    {
      id: 'laundry-receipts',
      severity: 'high',
      department: 'Laundry',
      property: 'Group · vendor expenses',
      title: '9 laundry expenses logged without receipts',
      summary:
        'Nine vendor expense entries worth $980 have no matching receipt in the document store. All were logged by the same shift supervisor within 48 hours.',
      meta: 'Laundry · expense audit',
      detectedAt: '08:10',
      confidence: 96,
      impact: { amount: 980, label: 'Unreconciled' },
      evidence: [
        { label: 'Entries flagged', value: '9', tone: 'danger' },
        { label: 'Total value', value: '$980', tone: 'warning' },
        { label: 'Document matches', value: '0 of 9', tone: 'danger' },
        { label: 'Same submitter', value: 'Yes · 1 user', tone: 'warning' },
      ],
      recommendation:
        'Hold month-end close for the Laundry line until receipts are uploaded. Escalate to the property manager if not resolved within 24 hours.',
      source: 'Sage × receipt OCR',
    },
    {
      id: 'events-sound-invoice',
      severity: 'medium',
      department: 'Events',
      property: 'Nairobi · DJ night',
      title: 'DJ night sound invoice has no PO match',
      summary:
        'The outsourced sound and staging invoice of $2,150 arrived 12% above the accepted quote with no purchase order raised. The event still cleared a 38.7% margin.',
      meta: 'Events · procurement',
      detectedAt: '09:26',
      confidence: 84,
      impact: { amount: 2150, label: 'Unapproved' },
      evidence: [
        { label: 'Accepted quote', value: '$1,920', tone: 'neutral' },
        { label: 'Invoice', value: '$2,150', tone: 'warning' },
        { label: 'Variance', value: '+$230 (12%)', tone: 'danger' },
        { label: 'PO reference', value: 'Missing', tone: 'danger' },
      ],
      recommendation:
        'Backfill a retroactive PO for the event and ask procurement to confirm the variance with the vendor. Add a PO gate for all outsourced event production.',
      source: 'Sage × vendor invoices',
    },
  ],

  addis: [
    {
      id: 'restaurant-food-cost',
      severity: 'medium',
      department: 'Restaurant',
      property: 'Addis · main kitchen',
      title: 'Restaurant food cost exceeded 40% target',
      summary:
        'Food cost closed at 41.6% (ETB 26,500 over budget) after the produce supplier increase. The 7-day average is drifting upward, now at 40.9%.',
      meta: 'Restaurant · cost control',
      detectedAt: '06:58',
      confidence: 90,
      impact: { amount: 26500, label: 'Over budget' },
      evidence: [
        { label: 'Food cost', value: '41.6%', tone: 'warning' },
        { label: 'Board target', value: '40.0%', tone: 'neutral' },
        { label: '7-day average', value: '40.9%', tone: 'warning' },
        { label: 'Largest driver', value: 'Produce +9.4%', tone: 'danger' },
      ],
      recommendation:
        'Reprice the three highest-volume mains or renegotiate the produce contract before the weekend menu reset.',
      source: 'MarketMan × Sage ledger',
    },
    {
      id: 'tour-deposits',
      severity: 'medium',
      department: 'Tours',
      property: 'Addis · tours desk',
      title: '2 tour deposits unmatched in bank feed',
      summary:
        'Two tour deposits totalling ETB 44,000 were recorded in the booking system but have no matching bank feed line after 36 hours.',
      meta: 'Tours · cash reconciliation',
      detectedAt: '08:05',
      confidence: 87,
      impact: { amount: 44000, label: 'Unmatched' },
      evidence: [
        { label: 'Deposits open', value: '2', tone: 'warning' },
        { label: 'Value', value: 'ETB 44,000', tone: 'warning' },
        { label: 'Age', value: '36 hours', tone: 'danger' },
        { label: 'Channel', value: 'Telebirr transfer', tone: 'neutral' },
      ],
      recommendation:
        'Reconcile against the Telebirr merchant statement and re-link the deposits to their booking references.',
      source: 'Booking engine × bank feed',
    },
    {
      id: 'bar-units',
      severity: 'high',
      department: 'Bar',
      property: 'Addis · Sky lounge',
      title: 'Bar inventory short by 2 units vs POS revenue',
      summary:
        'POS closed at 214 units sold; the count reconciles to 216 units. The variance is small in value (ETB 18,400) but appears in three of the last four counts.',
      meta: 'Bar · POS vs stock count',
      detectedAt: '07:42',
      confidence: 82,
      impact: { amount: 18400, label: 'Exposure' },
      evidence: [
        { label: 'POS units sold', value: '214 units', tone: 'neutral' },
        { label: 'Closing count', value: '216 units', tone: 'warning' },
        { label: 'Variance', value: '2 units', tone: 'danger' },
        { label: 'Pattern', value: '3 of last 4 counts', tone: 'danger' },
      ],
      recommendation:
        'Ask the Sky lounge lead to sign off the closing count for the next three nights and photograph the transfer sheet.',
      source: 'Lightspeed POS × MarketMan',
    },
  ],

  nairobi: [
    {
      id: 'bar-units',
      severity: 'high',
      department: 'Bar',
      property: 'Nairobi · Rooftop Bar',
      title: 'Bar inventory short by 4 units vs POS revenue',
      summary:
        'POS sold 128 units but the closing count reconciles to 132 units consumed. KES 62,400 at cost is unaccounted for — the same variance as the last two Saturdays.',
      meta: 'Bar · POS vs stock count',
      detectedAt: '07:42',
      confidence: 93,
      impact: { amount: 62400, label: 'Exposure' },
      evidence: [
        { label: 'POS units sold', value: '128 units', tone: 'neutral' },
        { label: 'Closing count', value: '132 units', tone: 'warning' },
        { label: 'Unit cost (weighted)', value: 'KES 15,600', tone: 'neutral' },
        { label: 'Pattern', value: '3rd Saturday in a row', tone: 'danger' },
      ],
      recommendation:
        'Request the 22:00 closing count sheet and the batch transfer log before adjusting stock. Hold the till reconciliation for Saturday night.',
      source: 'Lightspeed POS × MarketMan',
    },
    {
      id: 'events-sound-invoice',
      severity: 'medium',
      department: 'Events',
      property: 'Nairobi · DJ night',
      title: 'DJ night sound invoice 12% over quote',
      summary:
        'Outsourced sound and staging came in at KES 210,000 against a KES 187,500 accepted quote, with no purchase order raised against the vendor.',
      meta: 'Events · procurement',
      detectedAt: '09:26',
      confidence: 84,
      impact: { amount: 22500, label: 'Over quote' },
      evidence: [
        { label: 'Accepted quote', value: 'KES 187,500', tone: 'neutral' },
        { label: 'Invoice', value: 'KES 210,000', tone: 'warning' },
        { label: 'Variance', value: '+KES 22,500 (12%)', tone: 'danger' },
        { label: 'PO reference', value: 'Missing', tone: 'danger' },
      ],
      recommendation:
        'Backfill a retroactive PO and confirm the variance with the vendor. Event margin still cleared the 32% floor at 38.7%.',
      source: 'Sage × vendor invoices',
    },
    {
      id: 'laundry-receipts',
      severity: 'high',
      department: 'Laundry',
      property: 'Nairobi · vendor expenses',
      title: '6 laundry expenses logged without receipts',
      summary:
        'Six vendor entries worth KES 38,200 have no matching receipt. All six were submitted within the same 48-hour window by one supervisor.',
      meta: 'Laundry · expense audit',
      detectedAt: '08:10',
      confidence: 95,
      impact: { amount: 38200, label: 'Unreconciled' },
      evidence: [
        { label: 'Entries flagged', value: '6', tone: 'danger' },
        { label: 'Total value', value: 'KES 38,200', tone: 'warning' },
        { label: 'Document matches', value: '0 of 6', tone: 'danger' },
        { label: 'Same submitter', value: 'Yes · 1 user', tone: 'warning' },
      ],
      recommendation:
        'Hold month-end close for the Laundry line until receipts are uploaded. Escalate to the property manager within 24 hours.',
      source: 'Sage × receipt OCR',
    },
    {
      id: 'ota-commission-drift',
      severity: 'medium',
      department: 'Rooms',
      property: 'Nairobi · OTA channels',
      title: 'OTA commission drift on 3 bookings',
      summary:
        'Commission charged on three SiteMinder bookings is 2.4 points above the contracted rate, costing KES 14,800 in avoidable fees this week.',
      meta: 'Rooms · channel costs',
      detectedAt: '06:31',
      confidence: 79,
      impact: { amount: 14800, label: 'Leakage' },
      evidence: [
        { label: 'Bookings flagged', value: '3', tone: 'warning' },
        { label: 'Contracted rate', value: '14.0%', tone: 'neutral' },
        { label: 'Charged rate', value: '16.4%', tone: 'danger' },
        { label: 'Window', value: 'Last 7 days', tone: 'neutral' },
      ],
      recommendation:
        'Raise a commission dispute with the channel manager and validate the mapping for the Westlands rate plan.',
      source: 'SiteMinder × Sage ledger',
    },
  ],
};


const HEALTH = {
  global: {
    score: 82,
    scoreDelta: 4,
    cash: 214500,
    expenseRatio: 40.6,
    note: 'All 3 entities reporting',
    band: 'Healthy',
  },
  addis: {
    score: 88,
    scoreDelta: 2,
    cash: 9640000,
    expenseRatio: 36.7,
    note: 'Bole property · single entity',
    band: 'Excellent',
  },
  nairobi: {
    score: 79,
    scoreDelta: -3,
    cash: 5120000,
    expenseRatio: 39.8,
    note: 'Westlands property · single entity',
    band: 'Watch',
  },
};

const SYNC_ENTITIES = [
  {
    name: 'Reservations',
    system: 'Opera Cloud',
    records: 1284,
    latencyMs: 240,
    status: 'synced',
    icon: 'calendar',
  },
  {
    name: 'POS terminals',
    system: 'Lightspeed',
    records: 3412,
    latencyMs: 180,
    status: 'synced',
    icon: 'receipt',
  },
  {
    name: 'Inventory',
    system: 'MarketMan',
    records: 986,
    latencyMs: 620,
    status: 'delayed',
    icon: 'box',
    note: '2 count sheets pending review',
  },
  {
    name: 'Ledger & expenses',
    system: 'Sage Intacct',
    records: 214,
    latencyMs: 310,
    status: 'synced',
    icon: 'book',
  },
  {
    name: 'Channel manager',
    system: 'SiteMinder',
    records: 176,
    latencyMs: 420,
    status: 'synced',
    icon: 'globe',
  },
  {
    name: 'Receipt OCR',
    system: 'Dext',
    records: 142,
    latencyMs: 290,
    status: 'synced',
    icon: 'scan',
  },
];

const SYNC_EVENTS = [
  {
    time: '06:12',
    label: 'Morning aggregation completed',
    detail: '18,240 records · 0 write conflicts',
    status: 'ok',
  },
  {
    time: '05:58',
    label: 'Sage ledger pull',
    detail: '214 expense journals ingested',
    status: 'ok',
  },
  {
    time: '05:41',
    label: 'MarketMan count sync delayed',
    detail: 'Retried twice · resolved at 05:44',
    status: 'warn',
  },
  {
    time: '05:12',
    label: 'Nightly POS close',
    detail: '3 outlets · 3,412 transactions',
    status: 'ok',
  },
  {
    time: '04:30',
    label: 'Channel manager reconciliation',
    detail: '176 reservations matched · 0 orphans',
    status: 'ok',
  },
];


const startedAt = Date.now();
let lastSyncAt = new Date(startedAt - 2 * 60 * 1000);

const trainedPatterns = new Set();
const trainingLog = [];

function money(amount, currency, options = {}) {
  const { compact = false, signed = false } = options;
  const abs = Math.abs(amount);
  let formatted;

  if (compact && abs >= 100000) {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(abs);
  } else {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(abs);
  }

  if (signed) return `${amount < 0 ? '−' : '+'}${formatted}`;
  return amount < 0 ? `−${formatted}` : formatted;
}

function pct(value) {
  return `${value.toFixed(1)}%`;
}

function numeric(value, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function buildDepartment(department) {
  const net = department.gross - department.expenses;
  const margin = department.gross > 0 ? (net / department.gross) * 100 : 0;
  return {
    ...department,
    net,
    margin: Number(margin.toFixed(1)),
    peak: Math.max(...department.trend),
  };
}

function buildTotals(departments) {
  const gross = departments.reduce((sum, d) => sum + d.gross, 0);
  const expenses = departments.reduce((sum, d) => sum + d.expenses, 0);
  const net = gross - expenses;
  return {
    gross,
    expenses,
    net,
    margin: gross > 0 ? Number(((net / gross) * 100).toFixed(1)) : 0,
  };
}

/** Currency label sized for prose: exact for small numbers, compact for millions. */
function revenueLabel(amount, currency) {
  return money(amount, currency, { compact: amount >= 1000000 });
}

/**
 * The brief talks in revenue only: what came in, and whether that beat or missed plan.
 * No margins, occupancy or growth percentages — the supporting tiles keep the detail.
 */
function buildBrief(location, totals, highSeverity) {
  const base = BRIEFS[location.id];
  const expected = REVENUE_PLAN[location.id] || totals.gross;
  const ahead = totals.gross >= expected;
  const revenue = revenueLabel(totals.gross, location.currency);
  const expectation = revenueLabel(expected, location.currency);

  return {
    ...base,
    revenue: {
      amount: totals.gross,
      expected,
      ahead,
      label: revenue,
      expectedLabel: expectation,
      currency: location.currency,
    },
    segments: [
      { text: 'Revenue came in at ' },
      { text: revenue, tone: 'stat' },
      { text: ahead ? ' — higher than the ' : ' — lower than the ' },
      { text: expectation, tone: 'stat' },
      { text: ' we expected. ' },
      ...base.segments,
    ],
    signals: [
      {
        label: 'Revenue vs expected',
        value: revenue,
        note: ahead ? 'higher' : 'lower',
        tone: ahead ? 'positive' : 'negative',
      },
      {
        label: 'High-severity flags',
        value: numeric(highSeverity),
        note: highSeverity === 1 ? 'needs review' : 'need review',
        tone: highSeverity > 0 ? 'negative' : 'positive',
      },
      { label: 'PMS coverage', value: '3/3', note: 'entities synced', tone: 'neutral' },
    ],
  };
}

/** Yesterday's ISO date, the day every dashboard figure describes. */
function ledgerDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Split a department total across its template lines; the last line absorbs rounding. */
function splitPostings(total, lines) {
  let allocated = 0;
  return lines.map((line, index) => {
    const amount = index === lines.length - 1 ? total - allocated : Math.round(total * line.weight);
    allocated += amount;
    return { ...line, amount };
  });
}

function facetList(rows, key) {
  const counts = new Map();
  rows.forEach((row) => counts.set(row[key], (counts.get(row[key]) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, count }));
}

/**
 * Materialise the raw posting table for one context: every department's gross and
 * expenses exploded into individual lines, so the ledger ties back to /api/dashboard.
 */
function buildLedger(location) {
  const date = ledgerDate();
  const prefix = LEDGER_PREFIX[location.id] || 'MV';
  const rows = [];
  let sequence = 1040;
  let minutes = 6 * 60 + 8;

  DEPARTMENTS[location.id].forEach((department) => {
    const template = LEDGER_TEMPLATES[department.id];
    const postings = [
      ...splitPostings(department.gross, template.income).map((line) => ({ ...line, direction: 'revenue' })),
      ...splitPostings(department.expenses, template.expense).map((line) => ({ ...line, direction: 'expense' })),
    ];

    postings.forEach((posting) => {
      sequence += 7;
      minutes += 17;
      const time = `${String(Math.floor((minutes % 1440) / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      rows.push({
        ref: `${prefix}-${sequence}`,
        date,
        time,
        locationId: location.id,
        location: location.label,
        departmentId: department.id,
        department: department.name,
        category: posting.category,
        description: posting.description,
        source: posting.source,
        method: posting.method,
        status: posting.status || 'reconciled',
        direction: posting.direction,
        amount: posting.direction === 'revenue' ? posting.amount : -posting.amount,
        note: posting.note || '',
      });
    });
  });

  rows.sort((a, b) => b.time.localeCompare(a.time));

  const revenue = rows.filter((row) => row.direction === 'revenue').reduce((sum, row) => sum + row.amount, 0);
  const expenses = rows
    .filter((row) => row.direction === 'expense')
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const expected = buildTotals(DEPARTMENTS[location.id].map(buildDepartment));

  return {
    location,
    currency: location.currency,
    date,
    generatedAt: new Date().toISOString(),
    rows,
    facets: {
      departments: facetList(rows, 'department'),
      categories: facetList(rows, 'category'),
      sources: facetList(rows, 'source'),
      statuses: facetList(rows, 'status'),
    },
    statusLabels: { reconciled: 'Reconciled', pending: 'Pending', review: 'Review' },
    totals: { revenue, expenses, net: revenue - expenses, count: rows.length },
    reconciliation: {
      balanced: revenue === expected.gross && expenses === expected.expenses,
      ledgerRevenue: revenue,
      ledgerExpenses: expenses,
      expectedRevenue: expected.gross,
      expectedExpenses: expected.expenses,
    },
  };
}

/** Cached per context + day so repeated filter requests stay cheap. */
function getLedger(locationId = 'global') {
  const location = getLocation(locationId);
  const key = `${location.id}:${ledgerDate()}`;
  if (!ledgerCache.has(key)) ledgerCache.set(key, buildLedger(location));
  return ledgerCache.get(key);
}

function getLocation(locationId) {
  return LOCATIONS.find((location) => location.id === locationId) || LOCATIONS[0];
}

function getDashboard(locationId = 'global') {
  const location = getLocation(locationId);
  const departments = DEPARTMENTS[location.id].map(buildDepartment);
  const alerts = ALERTS[location.id].map((alert) => ({
    ...alert,
    trained: trainedPatterns.has(`${location.id}:${alert.id}`),
    impactLabel: money(alert.impact.amount, location.currency),
  }));

  alerts.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  const health = HEALTH[location.id];
  const openAlerts = alerts.filter((alert) => !alert.trained);
  const highSeverity = openAlerts.filter((alert) => alert.severity === 'high').length;
  const totals = buildTotals(departments);

  return {
    location,
    locations: LOCATIONS,
    brief: buildBrief(location, totals, highSeverity),
    departments,
    totals,
    alerts,
    health: {
      ...health,
      openFlags: openAlerts.length,
      highSeverity,
    },
    sync: {
      status: 'healthy',
      lastSync: lastSyncAt.toISOString(),
      entities: SYNC_ENTITIES,
      events: SYNC_EVENTS,
      trainedPatterns: trainedPatterns.size,
    },
    currency: location.currency,
    generatedAt: new Date().toISOString(),
  };
}

function markExpected(locationId, alertId, reason = 'Expected pattern') {
  const location = getLocation(locationId);
  const alert = ALERTS[location.id].find((item) => item.id === alertId);
  if (!alert) return null;

  const key = `${location.id}:${alertId}`;
  trainedPatterns.add(key);
  const entry = {
    key,
    alertId,
    title: alert.title,
    department: alert.department,
    reason,
    at: new Date().toISOString(),
  };
  trainingLog.unshift(entry);
  if (trainingLog.length > 25) trainingLog.length = 25;

  return { ok: true, alertId, trained: true, entry, trainedPatterns: trainedPatterns.size };
}

function resetTraining() {
  trainedPatterns.clear();
  trainingLog.length = 0;
  return { ok: true, trainedPatterns: 0 };
}

function getTrainingLog() {
  return trainingLog;
}

function forceSync() {
  lastSyncAt = new Date();
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Addis_Ababa',
  }).format(lastSyncAt);
  SYNC_EVENTS.unshift({
    time,
    label: 'Manual force sync completed',
    detail: '18,240 records · 0 write conflicts',
    status: 'ok',
  });
  if (SYNC_EVENTS.length > 6) SYNC_EVENTS.length = 6;
  return {
    ok: true,
    lastSync: lastSyncAt.toISOString(),
    records: 18240,
    conflicts: 0,
    durationMs: 1280,
  };
}

module.exports = {
  LOCATIONS,
  getDashboard,
  getLedger,
  markExpected,
  resetTraining,
  getTrainingLog,
  forceSync,
  getLocation,
  money,
  pct,
  numeric,
};

