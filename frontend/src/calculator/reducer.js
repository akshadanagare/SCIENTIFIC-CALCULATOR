import { clean, toStr } from './math.js';
import {
  evaluate, displayText, closeAll, depth, resultTokens,
  isNum, isOpen, isBin, endsOperand, allowsUnaryAfter, POSTFIX,
} from './engine.js';

const MAX_DIGITS = 15;

export const initialState = {
  tokens: [],          // the expression, one token per item
  result: null,        // number, after "="
  justEvaluated: false,
  error: null,
  errorExpr: '',
  memory: null,
  angle: 'deg',
  second: false,
  evalSeq: 0,          // goes up by one after every successful "=", used to save history
};

// tokens to edit: after "=" we either continue from the result or start fresh
const base = (s, continuing) => {
  if (s.justEvaluated) return continuing ? resultTokens(s.result) : [];
  return [...s.tokens];
};
const put = (s, tokens) => ({ ...s, tokens, result: null, justEvaluated: false });
const clearAll = (s) => ({ ...initialState, memory: s.memory, angle: s.angle, second: s.second, evalSeq: s.evalSeq });

const currentValue = (s) => {
  try {
    if (s.justEvaluated) return s.result;
    if (!s.tokens.length) return 0;
    return evaluate(s.tokens, s.angle);
  } catch {
    return null;
  }
};

export function reducer(state, action) {
  if (action.type === 'TOGGLE_ANGLE') return { ...state, angle: state.angle === 'deg' ? 'rad' : 'deg' };
  if (action.type === 'TOGGLE_SECOND') return { ...state, second: !state.second };
  if (action.type === 'CLEAR') return clearAll(state);
  if (action.type === 'HYDRATE') { // saved settings arriving from the server
    // Only fill values the user has not changed yet (the answer can arrive a moment after the page opens).
    return {
      ...state,
      angle: state.angle === 'deg' && action.angle === 'rad' ? 'rad' : state.angle,
      memory: state.memory === null && typeof action.memory === 'number' ? action.memory : state.memory,
    };
  }

  // any other key after an error starts a fresh expression
  const s = state.error
    ? { ...state, error: null, errorExpr: '', tokens: [], result: null, justEvaluated: false }
    : state;

  switch (action.type) {
    case 'DIGIT': {
      const t = base(s, false);
      const last = t[t.length - 1];
      if (isNum(last) && !last.includes('e')) {
        if (last === '0') t[t.length - 1] = action.digit;
        else if (last.replace('.', '').length < MAX_DIGITS) t[t.length - 1] = last + action.digit;
      } else {
        if (endsOperand(last)) t.push('×');
        t.push(action.digit);
      }
      return put(s, t);
    }

    case 'DECIMAL': {
      const t = base(s, false);
      const last = t[t.length - 1];
      if (isNum(last) && !last.includes('e')) {
        if (last.includes('.')) return put(s, t);
        t[t.length - 1] = last + '.';
      } else {
        if (endsOperand(last)) t.push('×');
        t.push('0.');
      }
      return put(s, t);
    }

    case 'OPERATOR': {
      const op = action.op;
      const t = base(s, true);
      const last = t[t.length - 1];
      if (last === undefined || isOpen(last)) {
        if (op === '−') t.push('−');            // unary minus: "−5", "(−5"
        return put(s, t);
      }
      if (isBin(last)) {
        if (op === '−' && allowsUnaryAfter(last)) { t.push('−'); return put(s, t); } // 5 × −3
        while (t.length && isBin(t[t.length - 1])) t.pop();                          // replace operator
        const l2 = t[t.length - 1];
        if (l2 === undefined || isOpen(l2)) { if (op === '−') t.push('−'); return put(s, t); }
        t.push(op);
        return put(s, t);
      }
      t.push(op);
      return put(s, t);
    }

    case 'OPEN': {
      const t = base(s, false);
      if (endsOperand(t[t.length - 1])) t.push('×');
      t.push('(');
      return put(s, t);
    }

    case 'CLOSE': {
      const t = base(s, true);
      if (depth(t) > 0 && endsOperand(t[t.length - 1])) t.push(')');
      return put(s, t);
    }

    case 'FUNC': {
      let t;
      if (s.justEvaluated) t = [action.token, ...resultTokens(s.result), ')']; // sin( 9 ) of the result
      else {
        t = [...s.tokens];
        if (endsOperand(t[t.length - 1])) t.push('×');
        t.push(action.token);
      }
      return put(s, t);
    }

    case 'CONST':
    case 'RAND': {
      const t = base(s, false);
      if (endsOperand(t[t.length - 1])) t.push('×');
      t.push(action.type === 'RAND' ? String(Math.round(Math.random() * 1e9) / 1e9) : action.token);
      return put(s, t);
    }

    case 'POSTFIX': {
      if (!POSTFIX.includes(action.token)) return s;
      const t = base(s, true);
      if (!endsOperand(t[t.length - 1])) return s;
      t.push(action.token);
      return put(s, t);
    }

    case 'EE': {
      const t = base(s, true);
      if (!endsOperand(t[t.length - 1])) return s;
      t.push('×', '10', '^');
      return put(s, t);
    }

    case 'POW_BASE': { // 10ˣ, 2ˣ, eˣ
      const t = base(s, false);
      if (endsOperand(t[t.length - 1])) t.push('×');
      t.push(action.base, '^', '(');
      return put(s, t);
    }

    case 'NEGATE': {
      const t = base(s, true);
      const i = t.length - 1;
      if (i < 0 || !isNum(t[i])) return s;
      const prev = t[i - 1];
      const prev2 = t[i - 2];
      const unaryMinus = prev === '−' && (i - 2 < 0 || isOpen(prev2) || allowsUnaryAfter(prev2));
      if (unaryMinus) {
        const wrapped = prev2 === '(' && (t[i - 3] === '+' || t[i - 3] === '−');
        t.splice(wrapped ? i - 2 : i - 1, wrapped ? 2 : 1);
      } else if (prev === undefined || isOpen(prev) || allowsUnaryAfter(prev)) {
        t.splice(i, 0, '−');
      } else {
        t.splice(i, 0, '(', '−');               // 5 − 3  ->  5 − (−3
      }
      return put(s, t);
    }

    case 'BACKSPACE': {
      const t = base(s, true);
      const last = t[t.length - 1];
      if (last === undefined) return put(s, t);
      if (isNum(last) && last.length > 1) t[t.length - 1] = last.slice(0, -1);
      else t.pop();
      return put(s, t);
    }

    case 'EQUALS': {
      if (s.justEvaluated || !s.tokens.length) return s;
      try {
        return { ...s, result: evaluate(s.tokens, s.angle), justEvaluated: true, evalSeq: s.evalSeq + 1 };
      } catch (err) {
        return { ...s, error: err.message, errorExpr: displayText(closeAll(s.tokens)), tokens: [], result: null, justEvaluated: false };
      }
    }

    case 'MEM': {
      switch (action.kind) {
        case 'MC': return { ...s, memory: null };
        case 'MR': {
          if (s.memory === null) return s;
          const t = base(s, false);
          if (endsOperand(t[t.length - 1])) t.push('×');
          const digits = toStr(Math.abs(s.memory));
          if (s.memory < 0) t.push('(', '−', digits, ')');
          else t.push(digits);
          return put(s, t);
        }
        default: {
          const v = currentValue(s);
          if (v === null) return s;
          if (action.kind === 'MS') return { ...s, memory: v };
          const delta = action.kind === 'MP' ? v : -v;
          return { ...s, memory: clean((s.memory ?? 0) + delta) };
        }
      }
    }

    case 'RECALL_RESULT': { // history: use an old result as the start of a new calculation
      const n = Number(action.value);
      if (!Number.isFinite(n)) return s;
      return put(s, resultTokens(n));
    }

    case 'RECALL_EXPR': { // history: load an old expression so it can be edited
      if (!Array.isArray(action.tokens) || !action.tokens.length) return s;
      return put(s, action.tokens.map(String));
    }

    default:
      return s;
  }
}

export { currentValue };
