import { useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react';
import { reducer, initialState, currentValue } from './calculator/reducer.js';
import { evaluate, displayText, closeAll, prepare } from './calculator/engine.js';
import { formatDisplay, toStr } from './calculator/math.js';
import { KEY_MAP } from './calculator/keys.js';
import Display from './components/Display.jsx';
import Keypad from './components/Keypad.jsx';
import History from './components/History.jsx';
import { useHistory } from './hooks/useHistory.js';
import { preferencesService } from './services/preferencesService.js';

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

const HistoryIcon = () => (
  <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' />
    <path d='M3 3v5h5' />
    <path d='M12 7v5l4 2' />
  </svg>
);

export default function App() {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const [mode, setMode] = useState('standard'); // 'standard' | 'scientific'
  const [theme, setTheme] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState('calculator'); // 'calculator' | 'history'
  const [editingId, setEditingId] = useState(null); // id of the history record being edited
  const [toast, setToast] = useState('');
  const [prefsReady, setPrefsReady] = useState(false);
  const touched = useRef({ theme: false, mode: false }); // changed by the user before the saved settings arrived
  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => setToast(''), 3500);
  }, []);
  const history = useHistory({ onError: showToast });

  // Every key press goes through here. AC also cancels an edit in progress.
  const dispatch = useCallback((action) => {
    if (action.type === 'CLEAR') setEditingId(null);
    rawDispatch(action);
  }, []);
  const viewRef = useRef(view);
  viewRef.current = view;
  const editingRef = useRef(editingId);
  editingRef.current = editingId;

  const scientific = mode === 'scientific';
  const screen = useMemo(() => buildView(state), [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Load the saved settings (theme, mode, Deg/Rad, memory) from the server once.
  useEffect(() => {
    let cancelled = false;
    preferencesService.getPreferences()
      .then((p) => {
        if (cancelled) return;
        if (!touched.current.theme && (p.theme === 'light' || p.theme === 'dark')) setTheme(p.theme);
        if (!touched.current.mode && (p.mode === 'standard' || p.mode === 'scientific')) setMode(p.mode);
        rawDispatch({ type: 'HYDRATE', angle: p.angle, memory: p.memory });
      })
      .catch(() => {}) // server offline: the calculator still works with default settings
      .finally(() => { if (!cancelled) setPrefsReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Save the settings again a moment after they change.
  useEffect(() => {
    if (!prefsReady) return undefined;
    const timer = setTimeout(() => {
      preferencesService.savePreferences({ theme, mode, angle: state.angle, memory: state.memory }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [prefsReady, theme, mode, state.angle, state.memory]);

  // Save every finished calculation (after "=") to the history on the server.
  // If a saved calculation was opened with "Edit", that same record is updated instead of adding a new one.
  const saveRef = useRef(null);
  saveRef.current = { add: history.add, update: history.update };
  useEffect(() => {
    if (!state.evalSeq) return;
    const tokens = closeAll(state.tokens);
    const entry = {
      expression: displayText(tokens),
      tokens,
      result: toStr(state.result),
      mode,
      angle: state.angle,
    };
    const id = editingRef.current;
    if (id) {
      setEditingId(null);
      saveRef.current.update(id, entry);
    } else {
      saveRef.current.add(entry);
    }
    // only runs when a new calculation is finished
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.evalSeq]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (viewRef.current !== 'calculator') return; // typing in the history search must not press calculator keys
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
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
  }, [dispatch]);

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

  const openHistory = () => { setView('history'); history.refresh(); };
  const closeHistory = () => { setView('calculator'); history.setQuery(''); };

  return (
    <main className='stage'>
      {view === 'history' ? (
        <div className='device device--history'>
          <History
            history={history}
            onBack={closeHistory}
            onUseResult={(value) => { dispatch({ type: 'RECALL_RESULT', value }); closeHistory(); }}
            onUseExpression={(item) => {
              dispatch({ type: 'RECALL_EXPR', tokens: item.tokens });
              setEditingId(item.id);
              closeHistory();
            }}
          />
        </div>
      ) : (
        <div className={`device ${scientific ? 'device--sci' : ''}`}>
          <header className='device__bar'>
            <div className='tabs' role='tablist' aria-label='Calculator mode'>
              {['standard', 'scientific'].map((m) => (
                <button
                  key={m}
                  role='tab'
                  aria-selected={mode === m}
                  className={`tab ${mode === m ? 'is-on' : ''}`}
                  onClick={() => { touched.current.mode = true; setMode(m); }}
                >
                  {m === 'standard' ? 'Standard' : 'Scientific'}
                </button>
              ))}
            </div>
            <div className='device__tools'>
              <button className='iconbtn iconbtn--bordered' onClick={openHistory} aria-label='Open history' title='History'>
                <HistoryIcon />
              </button>
              <button
                className='tool'
                onClick={() => { touched.current.theme = true; setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                aria-label='Toggle theme'
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </header>

          <Display
            top={screen.top}
            main={screen.main}
            error={state.error}
            memory={state.memory}
            angle={state.angle}
            scientific={scientific}
            onCopy={copy}
            copied={copied}
            editing={Boolean(editingId)}
            onCancelEdit={() => setEditingId(null)}
          />

          <Keypad dispatch={dispatch} scientific={scientific} second={state.second} angle={state.angle} />
        </div>
      )}

      {toast && <div className='toast' role='status'>{toast}</div>}
    </main>
  );
}
