import { MEMORY_KEYS, SCIENTIFIC_KEYS, STANDARD_KEYS } from '../calculator/keys.js';

function Key({ k, onPress, active }) {
  return (
    <button
      type="button"
      className={`key key--${k.kind ?? 'mem'} ${active ? 'is-active' : ''}`}
      onClick={() => onPress(k.action)}
      aria-label={k.aria}
      aria-pressed={k.kind === 'toggle' ? active : undefined}
    >
      {k.label}
    </button>
  );
}

export default function Keypad({ dispatch, scientific, second, angle }) {
  return (
    <div className="keypad">
      <div className="keys keys--memory">
        {MEMORY_KEYS.map((k) => (
          <Key key={k.label} k={k} onPress={dispatch} />
        ))}
      </div>

      <div className={`pads ${scientific ? 'pads--sci' : ''}`}>
        {scientific && (
          <div className="keys keys--sci">
            {SCIENTIFIC_KEYS.map((k) => {
              const flipped = second && k.second;
              const shown = flipped ? { ...k, label: k.second.label, action: k.second.action } : k;
              return <Key key={k.label} k={shown} onPress={dispatch} active={k.id === 'second' && second} />;
            })}
            <button
              type="button"
              className="key key--toggle key--span2"
              onClick={() => dispatch({ type: 'TOGGLE_ANGLE' })}
              aria-label="Switch between degrees and radians"
            >
              {angle === 'deg' ? 'Deg → Rad' : 'Rad → Deg'}
            </button>
          </div>
        )}

        <div className="keys keys--main">
          {STANDARD_KEYS.map((k) => (
            <Key key={k.label} k={k} onPress={dispatch} />
          ))}
        </div>
      </div>
    </div>
  );
}
