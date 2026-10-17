import { acceptsCalculatorInput } from '../src/core/calculatorInput';
test.each(['--', '−−', '-−', '−-', '5--2', '5− −2', '5-\t-2'])(
  'rejects adjacent minus signs: %s',
  value => expect(acceptsCalculatorInput(value)).toBe(false),
);
test.each(['', '-2', '−2', '5−2', '5×−2', '5÷-2', '5−(−2)', '2^-3'])(
  'accepts valid single minus input: %s',
  value => expect(acceptsCalculatorInput(value)).toBe(true),
);
test.each([
  '++',
  '+2',
  '5++2',
  '5××2',
  '5÷÷2',
  '5^×2',
  '1..2',
  '1.2.3',
  '()',
  ')2',
  '2)',
  '(2))',
  '2(3)',
  '2pi',
  '2 3',
  'sin()',
  'sin2',
  'unknown(2)',
  '5!!',
  '5%%',
  '2e++3',
  'NaN',
  'Infinity',
  '1;2',
  '😀',
])('rejects malformed syntax %s', value => {
  expect(acceptsCalculatorInput(value)).toBe(false);
});
test.each([
  '',
  '-',
  '.',
  '2+',
  '2×-',
  '(',
  '(2',
  'sqrt(',
  's',
  'si',
  'sin',
  '2e',
  '2e-',
  '2e+',
])('allows unfinished typing %s but not calculation', value => {
  expect(acceptsCalculatorInput(value)).toBe(true);
  expect(acceptsCalculatorInput(value, false)).toBe(false);
});
test.each([
  '.5',
  '5.',
  '2e-3',
  '2E+3',
  '2+-3',
  'sin(-30)',
  'sqrt(abs(-9))',
  '(2+3)!',
  'π×2',
  'e^2',
  '2^-3',
  '5!%',
])('accepts complete grammar %s', value =>
  expect(acceptsCalculatorInput(value, false)).toBe(true),
);
test('bounds pasted expression length', () =>
  expect(acceptsCalculatorInput('1'.repeat(401))).toBe(false));
