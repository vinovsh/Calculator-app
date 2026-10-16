import Decimal from 'decimal.js';
export type Field = {
  key: string;
  label: string;
  initial: string;
  kind?: 'date' | 'text' | 'select';
  options?: string[];
};
export type Result = { label: string; value: string; unit?: string };
export type Tool = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  group: string;
  fields?: Field[];
  calculate?: (v: Record<string, string>) => Result[];
  note?: string;
};
const field = (
  key: string,
  label: string,
  initial: string,
  kind?: Field['kind'],
  options?: string[],
): Field => ({ key, label, initial, kind, options });
const r = (label: string, value: Decimal.Value, unit?: string): Result => ({
  label,
  value: new Decimal(value).toSignificantDigits(18).toString(),
  unit,
});
const n = (v: Record<string, string>, key: string, min = 0, max = 1e15) => {
  const val = new Decimal(v[key] || 'NaN');
  if (!val.isFinite() || val.lt(min) || val.gt(max))
    throw Error(`Check ${key}: enter a value between ${min} and ${max}`);
  return val;
};
const positive = (v: Record<string, string>, key: string, max = 1e15) => {
  const d = n(v, key, 0, max);
  if (d.isZero()) throw Error(`${key} must be greater than zero`);
  return d;
};
export const dateValue = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
    throw Error('Use dates in YYYY-MM-DD format');
  const d = new Date(s + 'T12:00:00Z');
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== s)
    throw Error('Enter a valid date');
  return d;
};
const iso = (d: Date) => d.toISOString().slice(0, 10);
const today = iso(new Date());
const pct = (a: Decimal, b: Decimal) => a.mul(b).div(100);
export const tools: Tool[] = [
  {
    id: 'calculator',
    title: 'Calculator',
    subtitle: 'Everyday arithmetic',
    icon: 'Calculator',
    color: '#1764FF',
    group: 'Everyday',
  },
  {
    id: 'scientific',
    title: 'Scientific',
    subtitle: 'Advanced expressions',
    icon: 'FlaskConical',
    color: '#8556E8',
    group: 'Everyday',
  },
  {
    id: 'currency',
    title: 'Currency',
    subtitle: 'Daily exchange rates',
    icon: 'CircleDollarSign',
    color: '#0DA78C',
    group: 'Everyday',
  },
  {
    id: 'units',
    title: 'Units',
    subtitle: '12 conversion categories',
    icon: 'Ruler',
    color: '#1A9FCB',
    group: 'Everyday',
  },
  {
    id: 'discount',
    title: 'Discount',
    subtitle: 'Find the final price',
    icon: 'Tag',
    color: '#EF7767',
    group: 'Shopping',
    fields: [
      field('price', 'Original price', '1000'),
      field('discount', 'First discount (%)', '20'),
      field('extra', 'Additional discount (%)', '0'),
    ],
    calculate: v => {
      const p = n(v, 'price'),
        d = n(v, 'discount', 0, 100),
        e = n(v, 'extra', 0, 100),
        final = p.minus(pct(p, d)).mul(new Decimal(1).minus(e.div(100)));
      return [
        r('Final price', final),
        r('You save', p.minus(final)),
        r(
          'Effective discount',
          p.isZero() ? 0 : p.minus(final).div(p).mul(100),
          '%',
        ),
      ];
    },
  },
  {
    id: 'percentage',
    title: 'Percentage',
    subtitle: 'Percentages made simple',
    icon: 'Percent',
    color: '#EBA512',
    group: 'Everyday',
    fields: [
      field('mode', 'Calculation', 'Percentage of value', 'select', [
        'Percentage of value',
        'Percentage change',
        'What percent?',
        'Reverse percentage',
      ]),
      field('a', 'Value A', '1000'),
      field('b', 'Value B / percent', '18'),
    ],
    calculate: v => {
      const a = n(v, 'a', -1e15),
        b = n(v, 'b', -1e15);
      switch (v.mode) {
        case 'Percentage change':
          if (a.isZero()) throw Error('Original value cannot be zero');
          return [
            r('Percentage change', b.minus(a).div(a.abs()).mul(100), '%'),
          ];
        case 'What percent?':
          if (b.isZero()) throw Error('Total cannot be zero');
          return [r('A as a percentage of B', a.div(b).mul(100), '%')];
        case 'Reverse percentage':
          if (b.isZero()) throw Error('Percent cannot be zero');
          return [r('Original whole', a.mul(100).div(b))];
        default:
          return [r('Result', pct(a, b))];
      }
    },
    note: 'Percentage change uses A as the original value and B as the new value. Reverse percentage: A is B% of the original whole.',
  },
  {
    id: 'tax',
    title: 'GST & Tax',
    subtitle: 'Inclusive or exclusive',
    icon: 'Receipt',
    color: '#E9AA20',
    group: 'Shopping',
    fields: [
      field('amount', 'Amount', '1000'),
      field('rate', 'Tax rate (%)', '18'),
      field('mode', 'Tax method', 'Exclusive', 'select', [
        'Exclusive',
        'Inclusive',
      ]),
    ],
    calculate: v => {
      const a = n(v, 'amount'),
        rate = n(v, 'rate', 0, 1000),
        base =
          v.mode === 'Inclusive'
            ? a.div(new Decimal(1).plus(rate.div(100)))
            : a,
        tax = pct(base, rate);
      return [
        r('Total including tax', base.plus(tax)),
        r('Before tax', base),
        r('Tax amount', tax),
        r('CGST (half of GST)', tax.div(2)),
        r('SGST (half of GST)', tax.div(2)),
      ];
    },
    note: 'Enter the applicable tax rate yourself. The app does not determine tax liability.',
  },
  {
    id: 'body',
    title: 'Body Metrics',
    subtitle: 'BMI, BMR & energy',
    icon: 'HeartPulse',
    color: '#10AEAD',
    group: 'Health',
    fields: [
      field('weight', 'Weight (kg)', '70'),
      field('height', 'Height (cm)', '170'),
      field('age', 'Age (years)', '25'),
      field('sex', 'BMR formula', 'Male', 'select', ['Male', 'Female']),
      field('activity', 'Activity level', 'Sedentary', 'select', [
        'Sedentary',
        'Light',
        'Moderate',
        'Very active',
      ]),
    ],
    calculate: v => {
      const w = positive(v, 'weight', 700),
        h = positive(v, 'height', 300),
        a = n(v, 'age', 18, 120),
        bmr = w
          .mul(10)
          .plus(h.mul(6.25))
          .minus(a.mul(5))
          .plus(v.sex === 'Male' ? 5 : -161),
        factor = (
          {
            Sedentary: 1.2,
            Light: 1.375,
            Moderate: 1.55,
            'Very active': 1.725,
          } as Record<string, number>
        )[v.activity];
      return [
        r('Body mass index', w.div(h.div(100).pow(2)), 'kg/m²'),
        r('Basal metabolic rate', bmr, 'kcal/day'),
        r('Estimated maintenance', bmr.mul(factor), 'kcal/day'),
      ];
    },
    note: 'Adult estimates only (18+). BMI and Mifflin–St Jeor BMR are general screening estimates, not a diagnosis or dietary prescription.',
  },
  {
    id: 'date',
    title: 'Date & Age',
    subtitle: 'Days, dates & birthdays',
    icon: 'CalendarDays',
    color: '#9866DE',
    group: 'Lifestyle',
    fields: [
      field('start', 'Start / birth date', '2000-01-01', 'date'),
      field('end', 'End date', today, 'date'),
      field('days', 'Days to add to start', '0'),
    ],
    calculate: v => {
      const start = dateValue(v.start),
        end = dateValue(v.end);
      let years = end.getUTCFullYear() - start.getUTCFullYear();
      if (
        end.getUTCMonth() < start.getUTCMonth() ||
        (end.getUTCMonth() === start.getUTCMonth() &&
          end.getUTCDate() < start.getUTCDate())
      )
        years--;
      const days = n(v, 'days', -100000, 100000);
      if (!days.isInteger()) throw Error('Days must be a whole number');
      const added = new Date(start);
      added.setUTCDate(added.getUTCDate() + days.toNumber());
      return [
        r(
          'Days between dates',
          Math.round((end.getTime() - start.getTime()) / 86400000),
          'days',
        ),
        r('Completed years', years, 'years'),
        { label: 'Start date plus days', value: iso(added) },
      ];
    },
  },
  {
    id: 'fuel',
    title: 'Fuel Cost',
    subtitle: 'Plan your journey',
    icon: 'Car',
    color: '#0DAEAD',
    group: 'Travel',
    fields: [
      field('distance', 'Distance (km)', '250'),
      field('efficiency', 'Efficiency (km/L)', '18'),
      field('price', 'Fuel price per litre', '100'),
      field('people', 'Travellers', '1'),
    ],
    calculate: v => {
      const fuel = n(v, 'distance').div(positive(v, 'efficiency')),
        cost = fuel.mul(n(v, 'price')),
        people = positive(v, 'people', 1000);
      if (!people.isInteger()) throw Error('Travellers must be a whole number');
      return [
        r('Trip cost', cost),
        r('Fuel needed', fuel, 'L'),
        r('Cost per person', cost.div(people)),
      ];
    },
  },
  {
    id: 'efficiency',
    title: 'Fuel Efficiency',
    subtitle: 'Track your mileage',
    icon: 'Fuel',
    color: '#DB9E29',
    group: 'Travel',
    fields: [
      field('distance', 'Distance travelled (km)', '450'),
      field('fuel', 'Fuel used (litres)', '30'),
    ],
    calculate: v => {
      const d = positive(v, 'distance'),
        f = positive(v, 'fuel');
      return [
        r('Fuel efficiency', d.div(f), 'km/L'),
        r('Consumption', f.mul(100).div(d), 'L/100 km'),
        r('US miles per gallon', d.div(f).mul('2.352145833')),
      ];
    },
  },
  {
    id: 'grades',
    title: 'Grade Average',
    subtitle: 'Weighted scores',
    icon: 'GraduationCap',
    color: '#DE6FA0',
    group: 'Education',
    fields: [
      field('scores', 'Scores (comma separated)', '85, 90, 78', 'text'),
      field(
        'weights',
        'Weights / credits (comma separated)',
        '3, 4, 2',
        'text',
      ),
    ],
    calculate: v => {
      const scores = v.scores.split(',').map(s => new Decimal(s.trim())),
        weights = v.weights.split(',').map(s => new Decimal(s.trim()));
      if (
        scores.length !== weights.length ||
        !scores.length ||
        scores.length > 100
      )
        throw Error('Enter one weight for each score (up to 100)');
      if (
        scores.some(s => !s.isFinite() || s.lt(0) || s.gt(100)) ||
        weights.some(w => !w.isFinite() || w.lte(0))
      )
        throw Error('Scores must be 0–100 and weights greater than zero');
      const total = weights.reduce((a, b) => a.plus(b), new Decimal(0));
      return [
        r(
          'Weighted average',
          scores
            .reduce((a, s, i) => a.plus(s.mul(weights[i])), new Decimal(0))
            .div(total),
          '%',
        ),
        r('Total credits', total),
      ];
    },
  },
  {
    id: 'hex',
    title: 'Number Bases',
    subtitle: 'Binary, octal, decimal, hex',
    icon: 'Binary',
    color: '#8F5FE4',
    group: 'Education',
    fields: [
      field('value', 'Integer value', '255', 'text'),
      field('base', 'Input base', 'Decimal', 'select', [
        'Binary',
        'Octal',
        'Decimal',
        'Hexadecimal',
      ]),
    ],
    calculate: v => {
      const base = (
          { Binary: 2, Octal: 8, Decimal: 10, Hexadecimal: 16 } as Record<
            string,
            number
          >
        )[v.base],
        s = v.value.trim();
      if (
        s.length > 128 ||
        !(
          base === 2
            ? /^-?[01]+$/
            : base === 8
            ? /^-?[0-7]+$/
            : base === 10
            ? /^-?\d+$/
            : /^-?[0-9a-f]+$/i
        ).test(s)
      )
        throw Error(
          'Enter a valid integer for the selected base (max 128 digits)',
        );
      const neg = s[0] === '-',
        digits = neg ? s.slice(1) : s;
      let val = BigInt(0);
      for (const ch of digits)
        val = val * BigInt(base) + BigInt(parseInt(ch, 16));
      if (neg) val = -val;
      return [2, 8, 10, 16].map((b, i) => ({
        label: ['Binary', 'Octal', 'Decimal', 'Hexadecimal'][i],
        value: val.toString(b).toUpperCase(),
      }));
    },
  },
  {
    id: 'loan',
    title: 'Loan & EMI',
    subtitle: 'Repayments & interest',
    icon: 'Landmark',
    color: '#8B5DD7',
    group: 'Finance',
    fields: [
      field('principal', 'Loan amount', '500000'),
      field('rate', 'Annual interest (%)', '9'),
      field('months', 'Tenure (months)', '60'),
    ],
    calculate: v => {
      const p = positive(v, 'principal'),
        rate = n(v, 'rate', 0, 100).div(1200),
        months = positive(v, 'months', 1200);
      if (!months.isInteger())
        throw Error('Tenure must be a whole number of months');
      const growth = rate.plus(1).pow(months),
        emi = rate.isZero()
          ? p.div(months)
          : p.mul(rate).mul(growth).div(growth.minus(1));
      return [
        r('Monthly EMI', emi),
        r('Total repayment', emi.mul(months)),
        r('Total interest', emi.mul(months).minus(p)),
      ];
    },
    note: 'Fixed-rate monthly reducing-balance estimate. Fees, insurance and lender rounding are excluded.',
  },
  {
    id: 'savings',
    title: 'Savings & SIP',
    subtitle: 'Plan future growth',
    icon: 'PiggyBank',
    color: '#1FAF9E',
    group: 'Finance',
    fields: [
      field('initial', 'Initial investment', '10000'),
      field('monthly', 'Monthly contribution', '5000'),
      field('rate', 'Annual nominal return (%)', '10'),
      field('years', 'Duration (years)', '10'),
      field('timing', 'Monthly contribution timing', 'End of month', 'select', [
        'End of month',
        'Start of month',
      ]),
    ],
    calculate: v => {
      const initial = n(v, 'initial'),
        monthly = n(v, 'monthly'),
        rate = n(v, 'rate', 0, 100).div(1200),
        years = positive(v, 'years', 100),
        months = years.mul(12);
      if (!months.isInteger())
        throw Error('Duration must represent whole months');
      const growth = rate.plus(1).pow(months),
        contribution = rate.isZero()
          ? monthly.mul(months)
          : monthly
              .mul(growth.minus(1))
              .div(rate)
              .mul(v.timing === 'Start of month' ? rate.plus(1) : 1),
        future = initial.mul(growth).plus(contribution),
        invested = initial.plus(monthly.mul(months));
      return [
        r('Projected future value', future),
        r('Total invested', invested),
        r('Estimated growth', future.minus(invested)),
      ];
    },
    note: 'Monthly compounding at a constant nominal annual rate. Illustrative projection; actual returns vary. Taxes and fees are excluded.',
  },
  {
    id: 'tip',
    title: 'Tip & Split',
    subtitle: 'Share the bill fairly',
    icon: 'HandCoins',
    color: '#26AEB1',
    group: 'Shopping',
    fields: [
      field('bill', 'Bill amount', '1500'),
      field('tip', 'Tip (%)', '10'),
      field('people', 'Number of people', '3'),
    ],
    calculate: v => {
      const bill = n(v, 'bill'),
        tip = pct(bill, n(v, 'tip', 0, 1000)),
        people = positive(v, 'people', 1000);
      if (!people.isInteger())
        throw Error('Number of people must be a whole number');
      return [
        r('Per person', bill.plus(tip).div(people)),
        r('Total bill', bill.plus(tip)),
        r('Tip amount', tip),
      ];
    },
  },
  {
    id: 'unitprice',
    title: 'Unit Price',
    subtitle: 'Compare two products',
    icon: 'ShoppingBasket',
    color: '#DFA02A',
    group: 'Shopping',
    fields: [
      field('priceA', 'Product A price', '100'),
      field('qtyA', 'Product A quantity', '500'),
      field('priceB', 'Product B price', '180'),
      field('qtyB', 'Product B quantity', '1000'),
    ],
    calculate: v => {
      const a = n(v, 'priceA').div(positive(v, 'qtyA')),
        b = n(v, 'priceB').div(positive(v, 'qtyB'));
      return [
        r('A: price per unit', a),
        r('B: price per unit', b),
        {
          label: 'Better value',
          value: a.eq(b)
            ? 'Same unit price'
            : a.lt(b)
            ? 'Product A'
            : 'Product B',
        },
      ];
    },
    note: 'Use the same quantity unit for both products, for example grams or millilitres.',
  },
  {
    id: 'world',
    title: 'World Time',
    subtitle: 'Time across cities',
    icon: 'Globe2',
    color: '#297DE2',
    group: 'Travel',
  },
  {
    id: 'ovulation',
    title: 'Cycle Estimate',
    subtitle: 'Period & ovulation dates',
    icon: 'Heart',
    color: '#EF62A3',
    group: 'Health',
    fields: [
      field('start', 'First day of last period', today, 'date'),
      field('cycle', 'Average cycle length (days)', '28'),
    ],
    calculate: v => {
      const start = dateValue(v.start),
        cycle = n(v, 'cycle', 21, 45);
      if (!cycle.isInteger())
        throw Error('Cycle length must be a whole number');
      const add = (days: number) => {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + days);
        return iso(d);
      };
      const ov = cycle.toNumber() - 14;
      return [
        { label: 'Estimated next period', value: add(cycle.toNumber()) },
        { label: 'Estimated ovulation', value: add(ov) },
        {
          label: 'Estimated fertile window',
          value: `${add(ov - 5)} to ${add(ov + 1)}`,
        },
      ];
    },
    note: 'Calendar estimate only. Ovulation varies, even with regular cycles. Do not use this tool for contraception, diagnosis or treatment.',
  },
];
export const toolById = (id: string) =>
  tools.find(t => t.id === id) || tools[0];
