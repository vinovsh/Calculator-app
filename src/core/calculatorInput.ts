// Keep the input guard separate from the evaluator: subtraction of a negative
// remains valid mathematics, but the UI never accepts adjacent minus signs.
export function acceptsCalculatorInput(expression: string): boolean {
  return !/[-−]\s*[-−]/u.test(expression);
}
