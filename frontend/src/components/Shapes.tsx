// Drawings for Phase 3 questions: 100-square grids, polygons, rectangles, triangles and angles.

export function Grid100({ shaded }: { shaded: number }) {
  return (
    <div className="grid100" role="img" aria-label={`ระบาย ${shaded} จาก 100 ช่อง`}>
      {Array.from({ length: 100 }, (_, i) => (
        <span key={i} className={i < shaded ? 'on' : undefined} />
      ))}
    </div>
  );
}

export function Polygon({ sides }: { sides: number }) {
  const points = Array.from({ length: sides }, (_, k) => {
    const a = (k / sides) * 2 * Math.PI - Math.PI / 2;
    return `${60 + 50 * Math.cos(a)},${60 + 50 * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 120 120" width="150" height="150" role="img" aria-label={`รูป ${sides} ด้าน`}>
      <polygon points={points} className="shape" />
    </svg>
  );
}

export function Rect({ width, height, unit, grid }: { width: number; height: number; unit: string; grid?: boolean }) {
  // Scale so the longer side is ~200px but keep proportions.
  const scale = 200 / Math.max(width, height, 1);
  const w = width * scale;
  const h = height * scale;
  return (
    <svg
      viewBox={`-50 -30 ${w + 100} ${h + 60}`}
      width={Math.min(w + 100, 320)}
      role="img"
      aria-label={`สี่เหลี่ยมกว้าง ${width} ยาว ${height} ${unit}`}
    >
      <rect x="0" y="0" width={w} height={h} className="shape" />
      {grid &&
        Array.from({ length: width - 1 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * scale} y1="0" x2={(i + 1) * scale} y2={h} className="gridline" />
        ))}
      {grid &&
        Array.from({ length: height - 1 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * scale} x2={w} y2={(i + 1) * scale} className="gridline" />
        ))}
      <text x={w / 2} y={-10} className="dim">
        {width} {unit}
      </text>
      <text x={-10} y={h / 2} className="dim" textAnchor="end" dominantBaseline="middle">
        {height} {unit}
      </text>
    </svg>
  );
}

export function Triangle({ labels }: { labels: [string, string, string] }) {
  const [a, b, c] = labels;
  return (
    <svg viewBox="0 0 240 170" width="240" role="img" aria-label={`สามเหลี่ยม มุม ${labels.join(', ')}`}>
      <polygon points="20,150 220,150 90,20" className="shape" />
      <text x="56" y="138" className="angle-label">
        {a}
      </text>
      <text x="180" y="138" className="angle-label">
        {b}
      </text>
      <text x="94" y="62" className={c === '?' ? 'angle-label unknown' : 'angle-label'} textAnchor="middle">
        {c}
      </text>
    </svg>
  );
}

export function Angle({ degrees }: { degrees: number }) {
  const r = 90;
  const rad = (degrees * Math.PI) / 180;
  const ox = 110;
  const oy = 120;
  const x = ox + r * Math.cos(rad);
  const y = oy - r * Math.sin(rad);
  const arc = 26;
  const ax = ox + arc * Math.cos(rad);
  const ay = oy - arc * Math.sin(rad);
  return (
    <svg viewBox="0 0 220 140" width="220" role="img" aria-label="มุม">
      <line x1={ox} y1={oy} x2={ox + r} y2={oy} className="ray" />
      <line x1={ox} y1={oy} x2={x} y2={y} className="ray" />
      {degrees === 90 ? (
        <path d={`M${ox + 16} ${oy} L${ox + 16} ${oy - 16} L${ox} ${oy - 16}`} className="arc" />
      ) : (
        <path d={`M${ox + arc} ${oy} A${arc} ${arc} 0 ${degrees > 180 ? 1 : 0} 0 ${ax} ${ay}`} className="arc" />
      )}
      <circle cx={ox} cy={oy} r="4" className="vertex" />
    </svg>
  );
}

/** Analogue clock: short hour hand moves on between the numbers as the minutes pass, like a real clock. */
export function Clock({ hour, minute }: { hour: number; minute: number }) {
  const minuteAngle = minute * 6;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const hand = (angle: number, length: number) => {
    const a = ((angle - 90) * Math.PI) / 180;
    return { x2: 60 + length * Math.cos(a), y2: 60 + length * Math.sin(a) };
  };
  return (
    <svg viewBox="0 0 120 120" width="170" height="170" role="img" aria-label="นาฬิกา">
      <circle cx="60" cy="60" r="54" className="clock-face" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = ((i * 6 - 90) * Math.PI) / 180;
        const inner = i % 5 === 0 ? 46 : 49;
        return <line key={i} x1={60 + inner * Math.cos(a)} y1={60 + inner * Math.sin(a)} x2={60 + 52 * Math.cos(a)} y2={60 + 52 * Math.sin(a)} className={i % 5 === 0 ? 'tick big' : 'tick'} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = ((n * 30 - 90) * Math.PI) / 180;
        return (
          <text key={n} x={60 + 37 * Math.cos(a)} y={60 + 37 * Math.sin(a)} className="clock-num" textAnchor="middle" dominantBaseline="central">
            {n}
          </text>
        );
      })}
      <line x1="60" y1="60" {...hand(hourAngle, 26)} className="hand hour" />
      <line x1="60" y1="60" {...hand(minuteAngle, 40)} className="hand minute" />
      <circle cx="60" cy="60" r="3.5" className="clock-pin" />
    </svg>
  );
}

const NOTE_COLOR: Record<number, string> = { 20: 'note-20', 50: 'note-50', 100: 'note-100', 500: 'note-500', 1000: 'note-1000' };

/** Thai coins (round) and banknotes (rectangles in their real colours). */
export function Money({ items }: { items: { value: number; count: number }[] }) {
  return (
    <div className="money" role="img" aria-label={items.map((m) => `${m.value} บาท ${m.count} ${m.value >= 20 ? 'ใบ' : 'เหรียญ'}`).join(', ')}>
      {items.flatMap((m) =>
        Array.from({ length: m.count }, (_, i) =>
          m.value >= 20 ? (
            <span key={`${m.value}-${i}`} className={`note ${NOTE_COLOR[m.value] ?? ''}`}>
              {m.value}
            </span>
          ) : (
            <span key={`${m.value}-${i}`} className={`coin c${m.value}`}>
              {m.value}
            </span>
          ),
        ),
      )}
    </div>
  );
}
