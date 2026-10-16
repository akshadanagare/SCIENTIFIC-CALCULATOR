import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// All the styles of the dialog are in this file.
const css = `
.cd-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(30, 30, 30, 0.4);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}
.cd-box {
  width: min(340px, 100%);
  padding: 18px 20px 16px;
  border-radius: 14px;
  background: var(--key-num);
  color: var(--ink);
  border: 1px solid var(--line);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  text-align: left;
  font-family: var(--font);
}
.cd-box h3 { margin: 0 0 8px; font-size: 16px; font-weight: 600; }
.cd-box p { margin: 0 0 18px; font-size: 13px; color: var(--ink-dim); line-height: 1.4; }
.cd-actions { display: flex; justify-content: flex-end; gap: 8px; }
.cd-btn {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
}
.cd-btn:hover { background: var(--key-fn); }
.cd-btn--danger { background: #2f66a8; border-color: #2f66a8; color: #fff; }
.cd-btn--danger:hover { background: #285a96; }
`;

export default function ConfirmDialog({ title, message, confirmText = 'Delete', onConfirm, onCancel }) {
  // Esc closes the dialog
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // Rendered straight into <body>, so it is always centered on the screen
  return createPortal(
    <>
      <style>{css}</style>
      <div className='cd-overlay' onClick={onCancel}>
        <div
          className='cd-box'
          role='alertdialog'
          aria-modal='true'
          aria-labelledby='cd-title'
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id='cd-title'>{title}</h3>
          <p>{message}</p>
          <div className='cd-actions'>
            <button className='cd-btn' onClick={onCancel} autoFocus>Cancel</button>
            <button className='cd-btn cd-btn--danger' onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}