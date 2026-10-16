import { evaluate, formatNumber } from '../src/core/expression';
import { tools, dateValue } from '../src/core/tools';
import { categories, convertUnit } from '../src/core/units';
const calc = (id: string, values: Record<string, string>) => {
  const t = tools.find(x => x.id === id)!;
  return t.calculate!({
    ...Object.fromEntries(t.fields!.map(f => [f.key, f.initial])),
    ...values,
  });
};
const result = (id: string, values: Record<string, string>, index = 0) =>
  Number(calc(id, values)[index].value);
describe('Expression parsing and precision', () => {
  test.each([
    ['0.1+0.2', '0.3'],
    ['2+3*4', '14'],
    ['(2+3)*4', '20'],
    ['2^3^2', '512'],
    ['-2^2', '-4'],
    ['2^-3', '0.125'],
    ['1250×18%', '225'],
    ['200+10%', '200.1'],
    ['5!', '120'],
    ['0!', '1'],
    ['sqrt(81)', '9'],
    ['log(1000)', '3'],
    ['abs(-7)', '7'],
    ['sin(30)', '0.5'],
  ])('%s = %s', (expr, expected) => expect(evaluate(expr)).toBe(expected));
  test('radian angle mode', () =>
    expect(Number(evaluate('sin(pi/2)', false))).toBeCloseTo(1));
  test.each([
    '1/0',
    'sqrt(-1)',
    '5+',
    '(',
    'process.exit()',
    '1;2',
    '171!',
    'tan(90)',
    '2**3',
    '2 3',
    '1e1001',
  ])('rejects invalid or unsafe input %s', s =>
    expect(() => evaluate(s)).toThrow(),
  );
  test('supports Indian grouping and max precision', () => {
    expect(formatNumber('1234567.891', 2, true)).toBe('12,34,567.89');
    expect(formatNumber('0.3', 6)).toBe('0.3');
  });
});
describe('Calculator formulas and boundaries', () => {
  test('discounts apply sequentially', () => {
    expect(
      result('discount', { price: '1000', discount: '20', extra: '10' }),
    ).toBe(720);
    expect(result('discount', { price: '0' })).toBe(0);
  });
  test('inclusive and exclusive tax', () => {
    expect(
      result('tax', { amount: '100', rate: '18', mode: 'Exclusive' }),
    ).toBe(118);
    expect(
      result('tax', { amount: '118', rate: '18', mode: 'Inclusive' }, 1),
    ).toBe(100);
  });
  test('percentage modes', () => {
    expect(
      result('percentage', { mode: 'Percentage change', a: '100', b: '125' }),
    ).toBe(25);
    expect(
      result('percentage', { mode: 'What percent?', a: '20', b: '80' }),
    ).toBe(25);
    expect(
      result('percentage', { mode: 'Reverse percentage', a: '20', b: '10' }),
    ).toBe(200);
  });
  test('zero-rate EMI', () =>
    expect(
      result('loan', { principal: '12000', rate: '0', months: '12' }),
    ).toBe(1000));
  test('known monthly loan payment', () =>
    expect(
      result('loan', { principal: '100000', rate: '12', months: '12' }),
    ).toBeCloseTo(8884.8788678, 5));
  test('zero-rate savings', () =>
    expect(
      result('savings', {
        initial: '1000',
        monthly: '100',
        rate: '0',
        years: '1',
      }),
    ).toBe(2200));
  test('annuity due exceeds ordinary annuity', () =>
    expect(result('savings', { timing: 'Start of month' })).toBeGreaterThan(
      result('savings', { timing: 'End of month' }),
    ));
  test('split bill', () =>
    expect(result('tip', { bill: '100', tip: '20', people: '3' })).toBe(40));
  test('fuel cost', () =>
    expect(
      result('fuel', { distance: '100', efficiency: '20', price: '100' }),
    ).toBe(500));
  test('efficiency', () =>
    expect(result('efficiency', { distance: '400', fuel: '20' })).toBe(20));
  test('weighted average', () =>
    expect(result('grades', { scores: '80,100', weights: '1,3' })).toBe(95));
  test('body metrics formula', () => {
    expect(
      result(
        'body',
        { weight: '70', height: '170', age: '25', sex: 'Male' },
        1,
      ),
    ).toBe(1642.5);
    expect(result('body', {})).toBeCloseTo(24.22145, 4);
  });
  test('large exact hexadecimal conversion', () => {
    expect(
      calc('hex', { value: 'FFFFFFFFFFFFFFFF', base: 'Hexadecimal' })[2].value,
    ).toBe('18446744073709551615');
    expect(calc('hex', { value: '-10', base: 'Decimal' })[0].value).toBe(
      '-1010',
    );
  });
  test('unit price comparison', () =>
    expect(calc('unitprice', {})[2].value).toBe('Product B'));
  test('calendar date difference handles leap year', () =>
    expect(result('date', { start: '2024-02-28', end: '2024-03-01' })).toBe(2));
  test('date validator rejects impossible date', () =>
    expect(() => dateValue('2025-02-29')).toThrow());
  test('ovulation estimate', () =>
    expect(
      calc('ovulation', { start: '2026-01-01', cycle: '28' })[0].value,
    ).toBe('2026-01-29'));
  test.each([
    ['loan', { months: '0' }],
    ['fuel', { efficiency: '0' }],
    ['grades', { scores: '100,80', weights: '1' }],
    ['hex', { base: 'Binary', value: '102' }],
    ['percentage', { mode: 'Percentage change', a: '0' }],
    ['tip', { people: '1.5' }],
    ['discount', { discount: '101' }],
    ['body', { age: '12' }],
    ['savings', { years: '0.01' }],
  ])('rejects invalid %s inputs', (id, values) =>
    expect(() => calc(id, values as Record<string, string>)).toThrow(),
  );
});
describe('Unit conversions', () => {
  const cat = (name: string) => categories.find(x => x.name === name)!;
  test('feet to metres', () =>
    expect(Number(convertUnit('1', cat('Length'), 'Feet', 'Metres'))).toBe(
      0.3048,
    ));
  test('freezing and boiling points', () => {
    expect(convertUnit('32', cat('Temperature'), 'Fahrenheit', 'Celsius')).toBe(
      '0',
    );
    expect(
      convertUnit('100', cat('Temperature'), 'Celsius', 'Fahrenheit'),
    ).toBe('212');
  });
  test('absolute zero', () => {
    expect(convertUnit('0', cat('Temperature'), 'Kelvin', 'Celsius')).toBe(
      '-273.15',
    );
    expect(() =>
      convertUnit('-1', cat('Temperature'), 'Kelvin', 'Celsius'),
    ).toThrow();
  });
  test('binary and decimal data units differ', () => {
    expect(convertUnit('1', cat('Data'), 'KiB (1024)', 'Bytes')).toBe('1024');
    expect(convertUnit('1', cat('Data'), 'KB (1000)', 'Bytes')).toBe('1000');
  });
  test('all categories convert a unit to itself', () => {
    categories.forEach(c => {
      const unit = Object.keys(c.units)[0];
      expect(Number(convertUnit('10', c, unit, unit))).toBeCloseTo(10, 12);
    });
  });
});
