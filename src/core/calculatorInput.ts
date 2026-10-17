const functions = [
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'sqrt',
  'ln',
  'log',
  'abs',
  'exp',
];

// Validate grammar without evaluating it. An editor may contain a valid unfinished
// prefix (such as "sqrt(" or "2e-"); Equals requires a complete expression.
export function acceptsCalculatorInput(
  input: string,
  incomplete = true,
): boolean {
  if (input.length > 400 || /[-−]\s*[-−]/u.test(input)) return false;
  const source = input
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi');
  let index = 0,
    depth = 0,
    operand = true,
    signed = false;
  const postfix = new Set<string>();
  const skip = () => {
    while (/\s/.test(source[index] || '') && index < source.length) index++;
  };
  while (index < source.length) {
    skip();
    if (index === source.length) break;
    const ch = source[index];
    if (operand) {
      if (ch === '-' && !signed) {
        signed = true;
        index++;
        continue;
      }
      if (ch === '(') {
        depth++;
        signed = false;
        index++;
        continue;
      }
      if (/[\d.]/.test(ch)) {
        const number = source
          .slice(index)
          .match(/^(?:\d+(?:\.\d*)?|\.\d*)(?:[eE][+-]?\d*)?/)![0];
        index += number.length;
        if (number === '.' || /[eE][+-]?$/.test(number))
          return incomplete && source.slice(index).trim() === '';
      } else if (/[a-zA-Z]/.test(ch)) {
        const name = source.slice(index).match(/^[a-zA-Z]+/)![0];
        index += name.length;
        if (functions.includes(name)) {
          skip();
          if (index === source.length) return incomplete;
          if (source[index++] !== '(') return false;
          depth++;
          signed = false;
          continue;
        }
        if (name !== 'pi' && name !== 'e') {
          return (
            incomplete &&
            source.slice(index).trim() === '' &&
            [...functions, 'pi'].some(f => f.startsWith(name))
          );
        }
      } else return false;
      operand = false;
      signed = false;
      postfix.clear();
    } else {
      if (ch === ')') {
        if (!depth) return false;
        depth--;
        index++;
        postfix.clear();
      } else if (ch === '%' || ch === '!') {
        if (postfix.has(ch)) return false;
        postfix.add(ch);
        index++;
      } else if ('+-*/^'.includes(ch)) {
        operand = true;
        signed = false;
        index++;
        postfix.clear();
      } else return false;
    }
  }
  return incomplete || (!operand && depth === 0);
}
