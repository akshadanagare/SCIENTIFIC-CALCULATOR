// ---------- number helpers ----------

// Remove floating point noise: 0.1 + 0.2 -> 0.3, sin(180°) -> 0
export const clean = (n) => {
  if (!Number.isFinite(n)) return n;
  if (Math.abs(n) < 1e-12) return 0;
  return parseFloat(n.toPrecision(12));
};

// number -> plain string (no thousand separators)
export const toStr = (n) => {
  if (Object.is(n, -0) || n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e16 || abs < 1e-6) return n.toExponential();
  return String(n);
};

// string -> string with thousand separators, e.g. "1234567.89" -> "1,234,567.89"
export const formatDisplay = (str) => {
  if (str === undefined || str === null) return '';
  if (str.includes('e')) return str.replace('e+', ' × 10^').replace('e-', ' × 10^−').replace(/^-/, '−');
  const negative = str.startsWith('-');
  const body = negative ? str.slice(1) : str;
  const [int, dec] = body.split('.');
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (negative ? '−' : '') + withCommas + (dec !== undefined ? '.' + dec : '');
};

export const fmt = (n) => formatDisplay(toStr(n));

// ---------- binary operations ----------

export const compute = (a, op, b) => {
  let r;
  switch (op) {
    case '+': r = a + b; break;
    case '−': r = a - b; break;
    case '×': r = a * b; break;
    case '÷':
      if (b === 0) throw new Error(a === 0 ? 'Result is undefined' : 'Cannot divide by zero');
      r = a / b;
      break;
    case '^':
      if (a === 0 && b < 0) throw new Error('Cannot divide by zero');
      r = Math.pow(a, b);
      break;
    case 'root':
      if (b === 0) throw new Error('Invalid input');
      r = a < 0 && Number.isInteger(b) && Math.abs(b) % 2 === 1
        ? -Math.pow(-a, 1 / b)
        : Math.pow(a, 1 / b);
      break;
    case 'mod':
      if (b === 0) throw new Error('Cannot divide by zero');
      r = a % b;
      break;
    default: r = b;
  }
  if (Number.isNaN(r)) throw new Error('Invalid input');
  if (!Number.isFinite(r)) throw new Error('Overflow');
  return r; // no rounding between steps; evaluate() rounds the final answer once
};

// ---------- unary operations ----------

export const UNARY_LABELS = {
  sqr: 'sqr', sqrt: '√', inv: '1/', cube: 'cube', cbrt: '∛',
  sin: 'sin', cos: 'cos', tan: 'tan', asin: 'sin⁻¹', acos: 'cos⁻¹', atan: 'tan⁻¹',
  log: 'log', ln: 'ln', pow10: '10^', exp: 'e^', abs: 'abs', fact: 'fact',
};

export const applyUnary = (fn, v, angle) => {
  const toRad = (x) => (angle === 'deg' ? (x * Math.PI) / 180 : x);
  const fromRad = (x) => (angle === 'deg' ? (x * 180) / Math.PI : x);
  const invalid = () => { throw new Error('Invalid input'); };
  let r;

  switch (fn) {
    case 'sqr': r = v * v; break;
    case 'cube': r = v * v * v; break;
    case 'sqrt': if (v < 0) invalid(); r = Math.sqrt(v); break;
    case 'cbrt': r = Math.cbrt(v); break;
    case 'inv': if (v === 0) throw new Error('Cannot divide by zero'); r = 1 / v; break;
    case 'abs': r = Math.abs(v); break;
    case 'sin': r = Math.sin(toRad(v)); break;
    case 'cos': r = Math.cos(toRad(v)); break;
    case 'tan':
      if (angle === 'deg' && Math.abs(v % 180) === 90) invalid();
      r = Math.tan(toRad(v));
      break;
    case 'asin': if (Math.abs(v) > 1) invalid(); r = fromRad(Math.asin(v)); break;
    case 'acos': if (Math.abs(v) > 1) invalid(); r = fromRad(Math.acos(v)); break;
    case 'atan': r = fromRad(Math.atan(v)); break;
    case 'sinh': r = Math.sinh(v); break;
    case 'cosh': r = Math.cosh(v); break;
    case 'tanh': r = Math.tanh(v); break;
    case 'asinh': r = Math.asinh(v); break;
    case 'acosh': if (v < 1) invalid(); r = Math.acosh(v); break;
    case 'atanh': if (Math.abs(v) >= 1) invalid(); r = Math.atanh(v); break;
    case 'log2': if (v <= 0) invalid(); r = Math.log2(v); break;
    case 'log': if (v <= 0) invalid(); r = Math.log10(v); break;
    case 'ln': if (v <= 0) invalid(); r = Math.log(v); break;
    case 'pow10': r = Math.pow(10, v); break;
    case 'exp': r = Math.exp(v); break;
    case 'fact': {
      if (!Number.isInteger(v) || v < 0 || v > 170) invalid();
      r = 1;
      for (let i = 2; i <= v; i++) r *= i;
      break;
    }
    default: r = v;
  }
  if (Number.isNaN(r)) invalid();
  if (!Number.isFinite(r)) throw new Error('Overflow');
  return clean(r);
};

// function token (as typed in the expression) -> applyUnary name
export const FUNCTIONS = {
  'sin(': 'sin', 'cos(': 'cos', 'tan(': 'tan',
  'sin⁻¹(': 'asin', 'cos⁻¹(': 'acos', 'tan⁻¹(': 'atan',
  'sinh(': 'sinh', 'cosh(': 'cosh', 'tanh(': 'tanh',
  'sinh⁻¹(': 'asinh', 'cosh⁻¹(': 'acosh', 'tanh⁻¹(': 'atanh',
  'ln(': 'ln', 'log(': 'log', 'log₂(': 'log2',
  '√(': 'sqrt', '∛(': 'cbrt', 'abs(': 'abs',
};
