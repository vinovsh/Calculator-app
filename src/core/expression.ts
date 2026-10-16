import Decimal from 'decimal.js';
Decimal.set({ precision: 32, rounding: Decimal.ROUND_HALF_UP });
// Recursive descent parser. No eval, Function constructors or executable input.
export function evaluate(input: string, degrees = true): string {
  const source = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi');
  const tokens =
    source.match(/(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[^\s]/g) || [];
  if (!tokens.length || tokens.length > 500) throw Error('Enter a calculation');
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];
  const checked = (d: Decimal) => {
    if (!d.isFinite() || d.abs().gt('1e1000'))
      throw Error('Result is outside the supported range');
    return d;
  };
  function primary(): Decimal {
    let d: Decimal;
    const token = take();
    if (token === '(') {
      d = sum();
      if (take() !== ')') throw Error('Close the bracket');
    } else if (token === 'pi') d = Decimal.acos(-1);
    else if (token === 'e') d = new Decimal(1).exp();
    else if (
      /^(sin|cos|tan|asin|acos|atan|sqrt|ln|log|abs|exp)$/.test(token || '')
    ) {
      if (take() !== '(') throw Error('Use brackets after a function');
      const arg = sum();
      if (take() !== ')') throw Error('Close the function bracket');
      const radians = degrees ? arg.mul(Decimal.acos(-1)).div(180) : arg;
      switch (token) {
        case 'sin':
          d = radians.sin();
          break;
        case 'cos':
          d = radians.cos();
          break;
        case 'tan':
          if (radians.cos().abs().lt('1e-28'))
            throw Error('Tangent is undefined');
          d = radians.tan();
          break;
        case 'asin':
          d = arg.asin();
          if (degrees) d = d.mul(180).div(Decimal.acos(-1));
          break;
        case 'acos':
          d = arg.acos();
          if (degrees) d = d.mul(180).div(Decimal.acos(-1));
          break;
        case 'atan':
          d = arg.atan();
          if (degrees) d = d.mul(180).div(Decimal.acos(-1));
          break;
        case 'sqrt':
          d = arg.sqrt();
          break;
        case 'ln':
          d = arg.ln();
          break;
        case 'log':
          d = arg.log(10);
          break;
        case 'abs':
          d = arg.abs();
          break;
        default:
          d = arg.exp();
      }
    } else if (token && /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(token))
      d = new Decimal(token);
    else throw Error('Check the expression');
    while (peek() === '%' || peek() === '!') {
      if (take() === '%') d = d.div(100);
      else {
        if (!d.isInteger() || d.lt(0) || d.gt(170))
          throw Error('Factorial needs a whole number from 0 to 170');
        let f = new Decimal(1);
        for (let n = 2; n <= d.toNumber(); n++) f = f.mul(n);
        d = f;
      }
    }
    return checked(d);
  }
  function power(): Decimal {
    const d = primary();
    return peek() === '^' ? (take(), checked(d.pow(unary()))) : d;
  }
  function unary(): Decimal {
    if (peek() === '+') {
      take();
      return unary();
    }
    if (peek() === '-') {
      take();
      return unary().neg();
    }
    return power();
  }
  function product(): Decimal {
    let d = unary();
    while (peek() === '*' || peek() === '/') {
      const op = take(),
        rhs = unary();
      if (op === '/' && rhs.isZero()) throw Error('Cannot divide by zero');
      d = checked(op === '*' ? d.mul(rhs) : d.div(rhs));
    }
    return d;
  }
  function sum(): Decimal {
    let d = product();
    while (peek() === '+' || peek() === '-') {
      const op = take(),
        rhs = product();
      d = checked(op === '+' ? d.plus(rhs) : d.minus(rhs));
    }
    return d;
  }
  const result = sum();
  if (pos !== tokens.length) throw Error('Check the expression');
  return checked(result).toSignificantDigits(24).toString();
}
export function formatNumber(
  value: string | number,
  decimals = 6,
  indian = false,
): string {
  try {
    const d = new Decimal(value);
    if (!d.isFinite()) return '—';
    if (d.abs().gte('1e15') || (!d.isZero() && d.abs().lt('1e-8')))
      return d.toExponential(Math.min(decimals, 8));
    return Number(d.toFixed(decimals)).toLocaleString(
      indian ? 'en-IN' : 'en-US',
      { maximumFractionDigits: decimals },
    );
  } catch {
    return '—';
  }
}
