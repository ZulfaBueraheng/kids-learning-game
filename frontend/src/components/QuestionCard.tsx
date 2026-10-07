'use client';

import { useEffect, useRef, useState } from 'react';
import type { Question, QuestionVisual } from '@/lib/api';
import { readAutoRead, useSpeech, writeAutoRead, type SpeechPart } from '@/lib/speech';
import { MathText } from './MathText';
import { Angle, Clock, Grid100, Money, Polygon, Rect, Triangle } from './Shapes';

/** Skills that test reading the options themselves: saying them aloud would give the answer away. */
const SILENT_OPTIONS = new Set(['EN_LETTERS', 'EN_PHONICS', 'EN_VOCAB_PICTURE', 'EN_SPELLING', 'TH_CONSONANTS', 'TH_VOWELS', 'TH_WORDS', 'TH_SPELLING']);

export interface Feedback {
  chosen: string;
  isCorrect: boolean;
  /** Only shown when the game reveals answers (practice, not placement). */
  correctAnswer?: string;
}

interface Props {
  question: Question;
  feedback: Feedback | null;
  busy: boolean;
  allowHint?: boolean;
  /** show the hint straight away (after two mistakes in a row) */
  autoHint?: boolean;
  onAnswer: (answer: string, timeMs: number, hintUsed: boolean) => void;
}

export function QuestionCard({ question, feedback, busy, allowHint = true, autoHint = false, onAnswer }: Props) {
  const startedAt = useRef(0);
  // Cards are keyed by question, so these initial values apply per question.
  const [showHint, setShowHint] = useState(autoHint);
  const [autoRead, setAutoRead] = useState(readAutoRead);
  const [reading, setReading] = useState<number | null>(null);
  const autoReadDone = useRef(false);
  const speech = useSpeech();
  const canHint = allowHint && (!!question.hint || question.hintRemove.length > 0);
  const removed = canHint && showHint ? question.hintRemove : [];

  // Start the clock when a new question appears.
  useEffect(() => {
    startedAt.current = performance.now();
  }, [question.id]);

  const hintPart = (): SpeechPart[] =>
    question.hint ? [{ text: `คำใบ้: ${question.hint}`, onStart: () => setReading(null) }] : [];

  const questionParts = (): SpeechPart[] => {
    const parts: SpeechPart[] = [{ text: question.prompt, onStart: () => setReading(null) }];
    if (question.expression) parts.push({ text: question.expression });
    if (question.visual?.kind === 'passage') parts.push({ text: question.visual.text });
    if (!SILENT_OPTIONS.has(question.skillCode)) {
      // Only word options are read; numbers stay visual, or "which digit is สาม?" would just be sound-matching.
      question.options.forEach((option, i) => {
        if (/\p{L}/u.test(option) && !removed.includes(option)) parts.push({ text: option, onStart: () => setReading(i) });
      });
    }
    return parts;
  };

  // Read each new question aloud once voices are ready (and the hint too when it opens by itself).
  useEffect(() => {
    if (!speech.available || !autoRead || autoReadDone.current) return;
    autoReadDone.current = true;
    speech.speak([...questionParts(), ...(canHint && showHint ? hintPart() : [])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.available]);

  // Say whether the answer was right, and the right answer when the game reveals it.
  useEffect(() => {
    if (!feedback || !speech.available || !autoRead) return;
    if (feedback.isCorrect) speech.speak([{ text: 'ถูกต้อง เก่งมาก!' }]);
    else if (feedback.correctAnswer) speech.speak([{ text: `เกือบแล้ว คำตอบคือ ${feedback.correctAnswer}` }]);
    else speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  // event.timeStamp shares performance.now()'s clock
  const choose = (option: string, at: number) => {
    if (busy || feedback) return;
    onAnswer(option, Math.max(0, Math.round(at - startedAt.current)), showHint);
  };

  const openHint = () => {
    setShowHint(true);
    if (speech.available && autoRead) speech.speak(hintPart());
  };

  const toggleRead = () => (speech.speaking ? speech.stop() : speech.speak(questionParts()));

  const toggleAutoRead = (on: boolean) => {
    setAutoRead(on);
    writeAutoRead(on);
    if (!on) speech.stop();
  };

  // Highlight the option being read only while speech is playing.
  const highlighted = speech.speaking ? reading : null;

  const optionClass = (option: string, i: number) => {
    // Long answers (e.g. "0.03 < 0.05 < 0.83") use a smaller font so they stay on one line.
    let cls = option.length > 10 ? 'option long' : 'option';
    if (highlighted === i) cls += ' reading';
    if (!feedback) return removed.includes(option) ? `${cls} struck` : cls;
    if (option === feedback.correctAnswer || (feedback.isCorrect && option === feedback.chosen)) return `${cls} correct`;
    if (option === feedback.chosen) return `${cls} wrong`;
    return cls;
  };

  return (
    <div className="question">
      <div className="prompt-row">
        <div className="prompt">{question.prompt}</div>
        {speech.available && (
          <button
            type="button"
            className={speech.speaking ? 'speak on' : 'speak'}
            onClick={toggleRead}
            aria-label={speech.speaking ? 'หยุดอ่าน' : 'ฟังโจทย์'}
            title={speech.speaking ? 'หยุดอ่าน' : 'ฟังโจทย์'}
          >
            {speech.speaking ? '⏹️' : '🔊'}
          </button>
        )}
      </div>
      {question.expression && (
        <div className="expression">
          <MathText text={question.expression} />
        </div>
      )}
      {question.visual && <Visual visual={question.visual} />}

      <div className={question.options.length === 3 ? 'options three' : 'options'}>
        {question.options.map((option, i) => (
          <button
            key={option}
            data-value={option}
            className={optionClass(option, i)}
            disabled={busy || !!feedback || removed.includes(option)}
            aria-label={removed.includes(option) ? `${option} (ตัดออกแล้ว)` : undefined}
            onClick={(e) => choose(option, e.timeStamp)}
          >
            <MathText text={option} />
          </button>
        ))}
      </div>

      {canHint && !feedback && (
        showHint ? (
          question.hint && (
            <div className="hint row" style={{ justifyContent: 'center', gap: 8 }}>
              <span>💡 {question.hint}</span>
              {speech.available && (
                <button type="button" className="speak small" onClick={() => speech.speak(hintPart())} aria-label="ฟังคำใบ้" title="ฟังคำใบ้">
                  🔊
                </button>
              )}
            </div>
          )
        ) : (
          <button className="btn secondary" onClick={openHint}>
            💡 ขอคำใบ้
          </button>
        )
      )}

      {speech.available && (
        <label className="auto-read">
          <input type="checkbox" checked={autoRead} onChange={(e) => toggleAutoRead(e.target.checked)} />
          🔊 อ่านให้ฟังทุกข้อ
        </label>
      )}
    </div>
  );
}

function Visual({ visual }: { visual: QuestionVisual }) {
  switch (visual.kind) {
    case 'objects':
      return (
        <div className="visual" aria-label={`${visual.count} ชิ้น`}>
          {repeat(visual.emoji, visual.count)}
        </div>
      );
    case 'groups':
      return (
        <div className="groups">
          {visual.groups.map((g) => (
            <div className="group" key={g.label}>
              <div className="label">กลุ่ม {g.label}</div>
              <div className="visual">{repeat(g.emoji, g.count)}</div>
            </div>
          ))}
        </div>
      );
    case 'addition':
      return (
        <div className="visual">
          {repeat(visual.emoji, visual.a)}
          <span className="op">+</span>
          {repeat(visual.emoji, visual.b)}
        </div>
      );
    case 'array':
      return (
        <div className="array" style={{ gridTemplateColumns: `repeat(${visual.cols}, auto)` }} aria-label={`${visual.rows} แถว แถวละ ${visual.cols}`}>
          {repeat(visual.emoji, visual.rows * visual.cols)}
        </div>
      );
    case 'share':
      return (
        <div className="stack" style={{ alignItems: 'center', gap: 10 }}>
          <div className="visual">{repeat(visual.emoji, visual.total)}</div>
          <div className="plates">
            {Array.from({ length: visual.groups }, (_, i) => (
              <span key={i} className="plate">
                🧒
              </span>
            ))}
          </div>
        </div>
      );
    case 'fraction':
      return (
        <div className="fractions">
          {visual.items.map((f, i) => (
            <div key={i} className="stack" style={{ alignItems: 'center', gap: 4 }}>
              {visual.shape === 'circle' ? <Pie parts={f.parts} shaded={f.shaded} /> : <Bar parts={f.parts} shaded={f.shaded} />}
              {f.label && (
                <strong>
                  <MathText text={f.label} />
                </strong>
              )}
            </div>
          ))}
        </div>
      );
    case 'grid100':
      return <Grid100 shaded={visual.shaded} />;
    case 'tally':
      return (
        <div className="tally">
          {visual.items.map((t) => (
            <div key={t.label} className="tally-row">
              <span className="tally-label">{t.label}</span>
              <span className="visual" style={{ justifyContent: 'flex-start' }}>
                {repeat(t.emoji, t.count)}
              </span>
            </div>
          ))}
        </div>
      );
    case 'polygon':
      return <Polygon sides={visual.sides} />;
    case 'rect':
      return <Rect width={visual.width} height={visual.height} unit={visual.unit} grid={visual.grid} />;
    case 'triangle':
      return <Triangle labels={visual.labels} />;
    case 'angle':
      return <Angle degrees={visual.degrees} />;
    case 'passage':
      return <div className="passage">{visual.text}</div>;
    case 'clock':
      return <Clock hour={visual.hour} minute={visual.minute} />;
    case 'money':
      return <Money items={visual.items} />;
    case 'subtraction':
      return (
        <div className="visual">
          {Array.from({ length: visual.total }, (_, i) => (
            <span key={i} className={i >= visual.total - visual.remove ? 'removed' : undefined}>
              {visual.emoji}
            </span>
          ))}
        </div>
      );
  }
}

function Bar({ parts, shaded }: { parts: number; shaded: number }) {
  return (
    <div className="frac-bar" aria-label={`แบ่ง ${parts} ส่วน ระบาย ${shaded} ส่วน`}>
      {Array.from({ length: parts }, (_, i) => (
        <span key={i} className={i < shaded ? 'on' : undefined} />
      ))}
    </div>
  );
}

function Pie({ parts, shaded }: { parts: number; shaded: number }) {
  const r = 46;
  const point = (k: number) => {
    const a = (k / parts) * 2 * Math.PI - Math.PI / 2;
    return `${50 + r * Math.cos(a)} ${50 + r * Math.sin(a)}`;
  };
  return (
    <svg viewBox="0 0 100 100" width="130" height="130" role="img" aria-label={`แบ่ง ${parts} ส่วน ระบาย ${shaded} ส่วน`}>
      {Array.from({ length: parts }, (_, k) => (
        <path
          key={k}
          d={`M50 50 L${point(k)} A${r} ${r} 0 ${parts === 1 ? 1 : 0} 1 ${point(k + 1)} Z`}
          className={k < shaded ? 'slice on' : 'slice'}
        />
      ))}
    </svg>
  );
}

function repeat(emoji: string, count: number) {
  return Array.from({ length: count }, (_, i) => <span key={i}>{emoji}</span>);
}
