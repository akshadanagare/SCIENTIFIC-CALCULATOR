// Expression engine: tokens -> value, plus helpers used by the reducer and the display.
import { compute, applyUnary, clean, toStr, formatDisplay, FUNCTIONS } from './math.js';

export const BIN_OPS = ['+', '−', '×', '÷', '^', 'mod', 'ʸ√'];
export const POSTFIX = ['!', '%', '²', '³', '⁻¹'];
const AFTER_UNARY_OK = ['×', '÷', '^', 'ʸ√', 'mod']; // "5 × −3" is allowed

export const isNum = (t) => t !== undefined && /^\d/.test(t);
export const isFunc = (t) => t !== undefined && t.length > 1 && t.endsWith('(');
export const isOpen = (t) => t === '(' || isFunc(t);
export const isBin = (t) => BIN_OPS.includes(t);
export const allowsUnaryAfter = (t) => AFTER_UNARY_OK.includes(t);
export const endsOperand = (t) =>
  t !== undefined && (isNum(t) || t === ')' || t === 'π' || t === 'e' || POSTFIX.includes(t));

export const resultTokens = (n) => {
  const s = toStr(n);
  return s.startsWith('-') ? ['−', s.slice(1)] : [s];
};

export const depth = (tokens) =>
  tokens.filter(isOpen).length - tokens.filter((t) => t === ')').length;

export const closeAll = (tokens) => [...tokens, ...Array(Math.max(0, depth(tokens))).fill(')')];

// drop dangling operators / open brackets at the end: "5 + (" -> "5"
export const prepare = (tokens) => {
  const t = [...tokens];
  while (t.length && (isBin(t[t.length - 1]) || isOpen(t[t.length - 1]))) t.pop();
  return t;
};

// tokens -> text for the screen
export const displayText = (tokens) => {
  let out = '';
  tokens.forEach((t, i) => {
    const prev = tokens[i - 1];
    if (isNum(t)) out += formatDisplay(t);
    else if (t === '+' || t === '−') {
      const unary = i === 0 || isOpen(prev) || isBin(prev);
      out += unary ? t : ` ${t} `;
    } else if (t === '×' || t === '÷' || t === 'mod') out += ` ${t} `;
    else out += t;
  });
  return out;
};

// ---------- evaluator (recursive descent) ----------
// Precedence (low -> high):  + −  |  × ÷ mod  |  unary −  |  ^ ʸ√  |  ! % ² ³ ⁻¹  |  numbers ( ) functions
export function evaluate(tokens, angle = 'deg') {
  const t = prepare(tokens);
  if (!t.length) throw new Error('Invalid input');
  let pos = 0;
  const peek = () => t[pos];
  const next = () => t[pos++];
  const bad = () => { throw new Error('Invalid input'); };

  function expr() {
    let left = term().value;
    while (peek() === '+' || peek() === '−') {
      const op = next();
      const right = term();
      // "200 + 10%" means 200 + (10% of 200)
      const rv = right.pct !== undefined ? (left * right.pct) / 100 : right.value;
      left = compute(left, op, rv);
    }
    return left;
  }

  function term() {
    let cur = unary();
    while (peek() === '×' || peek() === '÷' || peek() === 'mod') {
      const op = next();
      const right = unary();
      cur = { value: compute(cur.value, op, right.value) };
    }
    return cur;
  }

  function unary() {
    if (peek() === '−') { next(); return { value: -unary().value }; }
    if (peek() === '+') { next(); return unary(); }
    return power();
  }

  function power() {
    const base = postfix();
    if (peek() === '^' || peek() === 'ʸ√') {
      const op = next();
      const exp = unary();
      return { value: compute(base.value, op === '^' ? '^' : 'root', exp.value) };
    }
    return base;
  }

  function postfix() {
    let cur = primary();
    while (POSTFIX.includes(peek())) {
      const p = next();
      const v = cur.value;
      if (p === '%') cur = { value: v / 100, pct: cur.pct === undefined ? v : undefined };
      else if (p === '²') cur = { value: applyUnary('sqr', v) };
      else if (p === '³') cur = { value: applyUnary('cube', v) };
      else if (p === '⁻¹') cur = { value: applyUnary('inv', v) };
      else cur = { value: applyUnary('fact', v) };
    }
    return cur;
  }

  function primary() {
    const tok = next();
    if (tok === undefined) bad();
    if (isNum(tok)) {
      const v = Number(tok);
      if (Number.isNaN(v)) bad();
      return { value: v };
    }
    if (tok === 'π') return { value: Math.PI };
    if (tok === 'e') return { value: Math.E };
    if (tok === '(') {
      const v = expr();
      if (peek() === ')') next();
      return { value: v };
    }
    if (isFunc(tok)) {
      const v = expr();
      if (peek() === ')') next();
      return { value: applyUnary(FUNCTIONS[tok], v, angle) };
    }
    return bad();
  }

  const value = expr();
  if (pos < t.length) bad();
  return clean(value);
}
