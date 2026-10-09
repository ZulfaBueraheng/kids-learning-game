'use client';

import { useEffect, useState } from 'react';
import { sfx } from '@/lib/sfx';

/** "3, 2, 1, ไป!" with a beep on each number, then calls `onDone`. */
export function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);

  useEffect(() => {
    sfx.countdown(n === 0);
    const t = setTimeout(() => (n === 0 ? onDone() : setN(n - 1)), n === 0 ? 550 : 700);
    return () => clearTimeout(t);
  }, [n, onDone]);

  return (
    <div className="card countdown" aria-live="assertive">
      <span key={n} className={n === 0 ? 'go' : undefined}>
        {n === 0 ? 'ไป! 🚀' : n}
      </span>
    </div>
  );
}

const CONFETTI_COLORS = ['#ff5e62', '#ffc531', '#20b26b', '#6c5ce7', '#2fb6f0', '#ff8ac6'];

/** Paper confetti falling over the page (decoration only). */
export function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 48 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
    })),
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
