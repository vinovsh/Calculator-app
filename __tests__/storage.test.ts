import {
  defaults,
  validateHistory,
  validateSettings,
} from '../src/core/storage';
test('validates settings backup', () =>
  expect(validateSettings(defaults)).toEqual(defaults));
test.each([
  { ...defaults, theme: 'broken' },
  { ...defaults, accent: 'red' },
  { ...defaults, decimals: 100 },
  { ...defaults, haptics: 'true' },
  { ...defaults, favorites: [null] },
])('rejects malformed preferences', s =>
  expect(() => validateSettings(s)).toThrow(),
);
test('validates history backup records', () => {
  const h = [
    {
      id: '1',
      tool: 'calculator',
      expression: '1+2',
      result: '3',
      date: '2026-01-01',
    },
  ];
  expect(validateHistory(h)).toEqual(h);
  expect(() => validateHistory([{ result: '3' }])).toThrow();
  expect(() => validateHistory(new Array(1001).fill(h[0]))).toThrow();
});
