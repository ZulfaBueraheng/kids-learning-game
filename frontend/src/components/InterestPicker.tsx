import { INTEREST_THEMES, THEMES, type InterestTheme } from '@/lib/api';

/** "What do you like?" chips. Questions are then dressed up in these themes. */
export function InterestPicker({
  value,
  onChange,
  disabled,
}: {
  value: InterestTheme[];
  onChange: (next: InterestTheme[]) => void;
  disabled?: boolean;
}) {
  const toggle = (t: InterestTheme) => onChange(value.includes(t) ? value.filter((v) => v !== t) : [...value, t]);
  return (
    <div className="interest-pick">
      {INTEREST_THEMES.map((t) => (
        <button type="button" key={t} aria-pressed={value.includes(t)} disabled={disabled} onClick={() => toggle(t)}>
          <span className="emoji">{THEMES[t].emoji}</span>
          {THEMES[t].label}
        </button>
      ))}
    </div>
  );
}
