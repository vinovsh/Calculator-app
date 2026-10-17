import { acceptsCalculatorInput } from '../src/core/calculatorInput';
test.each(['--', '−−', '-−', '−-', '5--2', '5− −2', '5-\t-2'])(
  'rejects adjacent minus signs: %s',
  value => expect(acceptsCalculatorInput(value)).toBe(false),
);
test.each(['', '-2', '−2', '5−2', '5×−2', '5÷-2', '5−(−2)', '2^-3'])(
  'accepts valid single minus input: %s',
  value => expect(acceptsCalculatorInput(value)).toBe(true),
);
