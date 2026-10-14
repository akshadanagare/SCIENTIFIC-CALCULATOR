import { useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react';
import { reducer, initialState, currentValue } from './calculator/reducer.js';
import { evaluate, displayText, closeAll, prepare } from './calculator/engine.js';
import { formatDisplay, toStr } from './calculator/math.js';
import { KEY_MAP } from './calculator/keys.js';
import Display from './components/Display.jsx';
import Keypad from './components/Keypad.jsx';
import History from './components/History.jsx';
import { useHistory } from './hooks/useHistory.js';
import { api } from './api.js';

// What the screen shows for a given calculator state
function buildView(state) {
  if (state.error) return { top: state.errorExpr, main: '' };

  if (state.justEvaluated) {
    return {
      top: displayText(closeAll(state.tokens)) + ' =',
      main: formatDisplay(toStr(state.result)),
    };
  }

  const main = state.tokens.length ? displayText(state.tokens) : '0';

  // live preview, shown only when there is something to calculate
  let top = '';
  const t = prepare(state.tokens);
  const plainNumber = t.length === 0 || (t.length === 1 && /^\d/.test(t[0])) ||
    (t.length === 2 && t[0] === '−' && /^\d/.test(t[1]));
  if (!plainNumber) {
    try {
      top = '= ' + formatDisplay(toStr(evaluate(state.tokens, state.angle)));
    } catch {
      top = '';
    }
  }
  return { top, main };
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mode, setMode] = useState('standard'); // 'standard' | 'scientific'
  const [theme, setTheme] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false); // history drawer on small screens
  const [prefsReady, setPrefsReady] = useState(false);
  const touched = useRef({ theme: false, mode: false }); // changed by the user before the saved settings arrived
  const history = useHistory();

  const scientific = mode === 'scientific';
  const view = useMemo(() => buildView(state), [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Load the saved settings (theme, mode, Deg/Rad, memory) from the server once.
  useEffect(() => {
    let cancelled = false;
    api.getPreferences()
      .then((p) => {
        if (cancelled) return;
        if (!touched.current.theme && (p.theme === 'light' || p.theme === 'dark')) setTheme(p.theme);
        if (!touched.current.mode && (p.mode === 'standard' || p.mode === 'scientific')) setMode(p.mode);
        dispatch({ type: 'HYDRATE', angle: p.angle, memory: p.memory });
      })
      .catch(() => {}) // server offline: the calculator still works with default settings
      .finally(() => { if (!cancelled) setPrefsReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Save the settings again a moment after they change.
  useEffect(() => {
    if (!prefsReady) return undefined;
    const timer = setTimeout(() => {
      api.savePreferences({ theme, mode, angle: state.angle, memory: state.memory }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [prefsReady, theme, mode, state.angle, state.memory]);

  // Save every finished calculation (after "=") to the history on the server.
  const addToHistory = useRef(history.add);
  addToHistory.current = history.add;
  useEffect(() => {
    if (!state.evalSeq) return;
    const tokens = closeAll(state.tokens);
    addToHistory.current({
      expression: displayText(tokens),
      tokens,
      result: toStr(state.result),
      mode,
      angle: state.angle,
    });
    // only runs when a new calculation is finished
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.evalSeq]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key)) {
        dispatch({ type: 'DIGIT', digit: e.key });
        return;
      }
      const action = KEY_MAP[e.key];
      if (action) {
        e.preventDefault();
        dispatch(action);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const copy = useCallback(async () => {
    const v = currentValue(state);
    if (v === null || state.error) return;
    try {
      await navigator.clipboard.writeText(toStr(v));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard not available */
    }
  }, [state]);

  return (
    <main className="stage">
      <div className={`device ${scientific ? 'device--sci' : ''}`}>
        <header className="device__bar">
          <div className="tabs" role="tablist" aria-label="Calculator mode">
            {['standard', 'scientific'].map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                className={`tab ${mode === m ? 'is-on' : ''}`}
                onClick={() => { touched.current.mode = true; setMode(m); }}
              >
                {m === 'standard' ? 'Standard' : 'Scientific'}
              </button>
            ))}
          </div>
          <button
            className="tool"
            onClick={() => { touched.current.theme = true; setTheme(theme === 'dark' ? 'light' : 'dark'); }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </header>

        <Display
          top={view.top}
          main={view.main}
          error={state.error}
          memory={state.memory}
          angle={state.angle}
          scientific={scientific}
          onCopy={copy}
          copied={copied}
        />

        <Keypad dispatch={dispatch} scientific={scientific} second={state.second} angle={state.angle} />
      </div>

      <History
        history={history}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onUseResult={(value) => { dispatch({ type: 'RECALL_RESULT', value }); setHistoryOpen(false); }}
        onUseExpression={(tokens) => { dispatch({ type: 'RECALL_EXPR', tokens }); setHistoryOpen(false); }}
      />
    </main>
  );
}
