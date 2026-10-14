export default function Display({ top, main, error, memory, angle, scientific, onCopy, copied }) {
  const text = error ?? main;
  const size = error ? 'error' : text.length > 24 ? 'xs' : text.length > 17 ? 'sm' : text.length > 11 ? 'md' : 'lg';

  return (
    <section className="display" aria-label="Display">
      <div className="display__meta">
        <span className={`badge ${memory !== null ? 'badge--on' : ''}`} title="Memory in use">M</span>
        {scientific && <span className="badge badge--on">{angle === 'deg' ? 'DEG' : 'RAD'}</span>}
        <button className="copy" onClick={onCopy} aria-label="Copy result">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="display__expr">{top || '\u00A0'}</div>
      <output className={`display__value display__value--${size}`} aria-live="polite">
        <span>{text}</span>
      </output>
    </section>
  );
}
