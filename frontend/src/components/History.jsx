import { useEffect, useRef, useState } from 'react';
import { formatDisplay } from '../calculator/math.js';
import ConfirmDialog from './ConfirmDialog.jsx';

const formatTime = (iso) =>
  new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const BackIcon = () => (
  <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <path d='m12 19-7-7 7-7' /><path d='M19 12H5' />
  </svg>
);

export default function History({ history, onBack, onUseResult, onUseExpression }) {
  const { items, total, query, setQuery, loading, failed, hasMore, remove, clear, loadMore, refresh } = history;
  const listRef = useRef(null);
  const endRef = useRef(null);
  const [confirm, setConfirm] = useState(null); // null | { type: 'one', id } | { type: 'all' }

  // Scroll down -> the next 5 records load (the marker at the end of the list comes into view).
  useEffect(() => {
    const end = endRef.current;
    if (!end || !hasMore || loading) return undefined;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { root: listRef.current, rootMargin: '0px 0px 40px 0px' }
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore, items.length]);

  return (
    <section className='history' aria-label='Calculation history'>
      <header className='history__head'>
        <button className='iconbtn' onClick={onBack} aria-label='Back to calculator' title='Back'>
          <BackIcon />
        </button>
        <h2>History</h2>
        <button
          className='link'
          onClick={() => setConfirm({ type: 'all' })}
          disabled={!items.length && !total}
        >
          Clear all
        </button>
      </header>

      <div className='search'>
        <input
          className='search__input'
          type='text'
          placeholder='Search history'
          aria-label='Search history'
          autoComplete='off'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className='search__clear' onClick={() => setQuery('')} aria-label='Clear search' title='Clear search'>
            <svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' aria-hidden='true'>
              <path d='M18 6 6 18' /><path d='m6 6 12 12' />
            </svg>
          </button>
        )}
      </div>

      <div className='history__scroll' ref={listRef}>
        {items.length === 0 ? (
          <p className='history__empty'>
            {loading
              ? 'Loading…'
              : failed
                ? <>Could not load the history. <button className='link' onClick={refresh}>Try again</button></>
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
                  <span>{formatTime(h.createdAt)}</span>
                  <span className='history__tools'>
                    <button className='link' onClick={() => onUseExpression(h)}>Edit</button>
                    <button
                      className='link'
                      onClick={() => setConfirm({ type: 'one', id: h.id })}
                      aria-label='Delete this calculation'
                    >
                      Delete
                    </button>
                  </span>
                </div>
              </li>
            ))}
            {hasMore && <li ref={endRef} className='history__end'>{loading ? 'Loading…' : ''}</li>}
          </ul>
        )}
      </div>

      <footer className='history__foot'>
        <span>{total} saved {total === 1 ? 'calculation' : 'calculations'}</span>
      </footer>

      {confirm && (
        <ConfirmDialog
          title={confirm.type === 'all' ? 'Delete All History' : 'Delete Record'}
          message={
            confirm.type === 'all'
              ? 'Are you sure you want to delete all saved calculations?'
              : 'Are you sure you want to delete this record?'
          }
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.type === 'all') clear();
            else remove(confirm.id);
            setConfirm(null);
          }}
        />
      )}
    </section>
  );
}