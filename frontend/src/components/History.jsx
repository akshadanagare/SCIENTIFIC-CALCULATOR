import { formatDisplay } from '../calculator/math.js';

const formatTime = (iso) =>
  new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function History({ history, open, onClose, onUseResult, onUseExpression }) {
  const { items, total, query, setQuery, loading, offline, hasMore, remaining, remove, clear, loadMore, retry } = history;

  const askClear = () => {
    if (window.confirm('Delete all saved calculations?')) clear();
  };

  return (
    <aside className={`history ${open ? 'is-open' : ''}`} aria-label='Calculation history'>
      <header className='history__head'>
        <h2>
          History
          <span
            className={`dot ${offline ? 'dot--off' : 'dot--on'}`}
            title={offline ? 'Server not reachable' : 'Connected to server'}
            role='img'
            aria-label={offline ? 'Server not reachable' : 'Connected to server'}
          />
        </h2>
        <div className='history__actions'>
          <button className='link' onClick={askClear} disabled={!items.length}>Clear all</button>
          <button className='link history__close' onClick={onClose}>Close</button>
        </div>
      </header>

      <input
        className='history__search'
        type='search'
        placeholder='Search history'
        aria-label='Search history'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {offline && (
        <div className='history__offline' role='status'>
          Server not reachable. New calculations stay on this page only until you refresh.{' '}
          <button className='link' onClick={retry}>Retry</button>
        </div>
      )}

      {items.length === 0 ? (
        <p className='history__empty'>
          {loading
            ? 'Loading…'
            : query
              ? 'No calculation matches your search.'
              : 'No calculations yet. Press = and the calculation is saved here.'}
        </p>
      ) : (
        <ul className='history__list'>
          {items.map((h) => (
            <li key={h.id}>
              <button className='history__row' onClick={() => onUseResult(h.result)} title='Use this result'>
                <span className='history__expr'>{h.expression} =</span>
                <span className='history__result'>{formatDisplay(h.result)}</span>
              </button>
              <div className='history__meta'>
                <span>{formatTime(h.createdAt)}{h.local ? ' · not saved' : ''}</span>
                <span className='history__tools'>
                  <button className='link' onClick={() => onUseExpression(h.tokens)}>Edit</button>
                  <button className='link' onClick={() => remove(h.id)} aria-label='Delete this calculation'>Delete</button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button className='history__more' onClick={loadMore} disabled={loading}>
          {loading ? 'Loading…' : `Load more (${remaining} left)`}
        </button>
      )}

      <footer className='history__foot'>
        <span>{total} saved {total === 1 ? 'calculation' : 'calculations'}</span>
      </footer>
    </aside>
  );
}
