// Key layouts. `kind` controls the colour of the key, `action` is dispatched to the reducer.

const d = (n) => ({ label: String(n), kind: 'num', action: { type: 'DIGIT', digit: String(n) }, aria: String(n) });
const op = (label, o, aria) => ({ label, kind: 'op', action: { type: 'OPERATOR', op: o }, aria });
const post = (label, token, aria, kind = 'fn') => ({ label, kind, action: { type: 'POSTFIX', token }, aria });
const fn = (label, token, aria, second) => ({
  label, kind: 'sci', aria,
  action: { type: 'FUNC', token },
  second: second && { label: second.label, action: { type: 'FUNC', token: second.token } },
});

export const MEMORY_KEYS = [
  { label: 'MC', action: { type: 'MEM', kind: 'MC' }, aria: 'Memory clear' },
  { label: 'MR', action: { type: 'MEM', kind: 'MR' }, aria: 'Memory recall' },
  { label: 'M+', action: { type: 'MEM', kind: 'MP' }, aria: 'Memory add' },
  { label: 'M−', action: { type: 'MEM', kind: 'MM' }, aria: 'Memory subtract' },
  { label: 'MS', action: { type: 'MEM', kind: 'MS' }, aria: 'Memory store' },
];

export const STANDARD_KEYS = [
  { label: 'AC', kind: 'clear', action: { type: 'CLEAR' }, aria: 'All clear' },
  { label: '(', kind: 'fn', action: { type: 'OPEN' }, aria: 'Open bracket' },
  { label: ')', kind: 'fn', action: { type: 'CLOSE' }, aria: 'Close bracket' },
  { label: '⌫', kind: 'fn', action: { type: 'BACKSPACE' }, aria: 'Backspace' },

  post('%', '%', 'Percent'),
  post('x²', '²', 'Square'),
  { label: '√x', kind: 'fn', action: { type: 'FUNC', token: '√(' }, aria: 'Square root' },
  op('÷', '÷', 'Divide'),

  d(7), d(8), d(9), op('×', '×', 'Multiply'),
  d(4), d(5), d(6), op('−', '−', 'Subtract'),
  d(1), d(2), d(3), op('+', '+', 'Add'),

  { label: '±', kind: 'num', action: { type: 'NEGATE' }, aria: 'Toggle sign' },
  d(0),
  { label: '.', kind: 'num', action: { type: 'DECIMAL' }, aria: 'Decimal point' },
  { label: '=', kind: 'eq', action: { type: 'EQUALS' }, aria: 'Equals' },
];

// 5 columns. `second` replaces the key while "2nd" is on.
export const SCIENTIFIC_KEYS = [
  { id: 'second', label: '2nd', kind: 'toggle', action: { type: 'TOGGLE_SECOND' }, aria: 'Second functions' },
  { label: 'π', kind: 'sci', action: { type: 'CONST', token: 'π' }, aria: 'Pi' },
  { label: 'e', kind: 'sci', action: { type: 'CONST', token: 'e' }, aria: 'Euler number' },
  { label: 'Rand', kind: 'sci', action: { type: 'RAND' }, aria: 'Random number' },
  op('mod', 'mod', 'Modulo'),

  fn('sin', 'sin(', 'Sine', { label: 'sin⁻¹', token: 'sin⁻¹(' }),
  fn('cos', 'cos(', 'Cosine', { label: 'cos⁻¹', token: 'cos⁻¹(' }),
  fn('tan', 'tan(', 'Tangent', { label: 'tan⁻¹', token: 'tan⁻¹(' }),
  fn('sinh', 'sinh(', 'Hyperbolic sine', { label: 'sinh⁻¹', token: 'sinh⁻¹(' }),
  fn('cosh', 'cosh(', 'Hyperbolic cosine', { label: 'cosh⁻¹', token: 'cosh⁻¹(' }),

  fn('tanh', 'tanh(', 'Hyperbolic tangent', { label: 'tanh⁻¹', token: 'tanh⁻¹(' }),
  fn('ln', 'ln(', 'Natural log'),
  fn('log', 'log(', 'Log base 10', { label: 'log₂', token: 'log₂(' }),
  {
    label: '10ˣ', kind: 'sci', aria: 'Ten to the power x',
    action: { type: 'POW_BASE', base: '10' },
    second: { label: '2ˣ', action: { type: 'POW_BASE', base: '2' } },
  },
  { label: 'eˣ', kind: 'sci', action: { type: 'POW_BASE', base: 'e' }, aria: 'e to the power x' },

  { label: 'xʸ', kind: 'sci', action: { type: 'OPERATOR', op: '^' }, aria: 'x to the power y' },
  post('x³', '³', 'Cube', 'sci'),
  fn('∛x', '∛(', 'Cube root'),
  { label: 'ʸ√x', kind: 'sci', action: { type: 'OPERATOR', op: 'ʸ√' }, aria: 'y-th root' },
  post('x!', '!', 'Factorial', 'sci'),

  fn('|x|', 'abs(', 'Absolute value'),
  { label: 'EE', kind: 'sci', action: { type: 'EE' }, aria: 'Times ten to the power' },
  post('x⁻¹', '⁻¹', 'Reciprocal', 'sci'),
];

// Keyboard -> action
export const KEY_MAP = {
  '+': { type: 'OPERATOR', op: '+' },
  '-': { type: 'OPERATOR', op: '−' },
  '*': { type: 'OPERATOR', op: '×' },
  'x': { type: 'OPERATOR', op: '×' },
  '/': { type: 'OPERATOR', op: '÷' },
  '^': { type: 'OPERATOR', op: '^' },
  '.': { type: 'DECIMAL' },
  ',': { type: 'DECIMAL' },
  '(': { type: 'OPEN' },
  ')': { type: 'CLOSE' },
  '%': { type: 'POSTFIX', token: '%' },
  '!': { type: 'POSTFIX', token: '!' },
  'Enter': { type: 'EQUALS' },
  '=': { type: 'EQUALS' },
  'Backspace': { type: 'BACKSPACE' },
  'Delete': { type: 'CLEAR' },
  'Escape': { type: 'CLEAR' },
  'p': { type: 'CONST', token: 'π' },
  'e': { type: 'CONST', token: 'e' },
  's': { type: 'FUNC', token: 'sin(' },
  'c': { type: 'FUNC', token: 'cos(' },
  't': { type: 'FUNC', token: 'tan(' },
  'l': { type: 'FUNC', token: 'ln(' },
  'q': { type: 'FUNC', token: '√(' },
};
