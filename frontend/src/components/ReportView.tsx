import type { ReactNode } from 'react';
import { goalOptions, GRADES, SUBJECT_META, THEMES, type StudentReport } from '@/lib/api';
import { ProgressBar, STATUS_LABEL, masteryTone } from './bits';
import { Character } from './Character';
import { WeekChart } from './WeekChart';

const TONE_ICON = { good: '🌟', tip: '💡', warn: '⚠️' } as const;

/** A child's learning report for parents and teachers (also prints cleanly). One subject at a time. */
export function ReportView({
  report,
  actions,
  onSubject,
}: {
  report: StudentReport;
  actions?: ReactNode;
  onSubject?: (code: string) => void;
}) {
  const { student } = report;
  const grade = GRADES.find((g) => g.value === student.grade)?.label ?? student.grade;
  const goal = goalOptions(report.subject).find((g) => g.value === student.goal);
  const started = report.skills.filter((s) => s.mastery > 0 || s.attempts > 0);
  const groups = [...new Set(started.map((s) => s.group))];
  const lastActive = report.lastActiveAt
    ? new Date(report.lastActiveAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'ยังไม่เคยเล่น';

  return (
    <div className="stack report">
      <div className="subject-tabs no-print" role="tablist" aria-label="เลือกวิชา">
        {report.subjects.map((s) => (
          <button key={s.code} role="tab" aria-selected={s.code === report.subject} onClick={() => onSubject?.(s.code)}>
            <span>
              {s.emoji} {s.nameTh}
            </span>
            <span className="muted">{s.placementDone || s.progress > 0 ? `${Math.round(s.progress * 100)}%` : 'ยังไม่เริ่ม'}</span>
          </button>
        ))}
      </div>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div className="row">
          <Character look={report.character} size={44} />
          <div>
            <h2>{student.nickname}</h2>
            <div className="muted">
              {grade} · เลเวล {report.level.level} · เล่นล่าสุด {lastActive}
            </div>
          </div>
        </div>
        <div className="row no-print">
          <button className="btn secondary" onClick={() => window.print()}>
            🖨️ พิมพ์รายงาน
          </button>
          {actions}
        </div>
      </div>

      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>ความก้าวหน้า{SUBJECT_META[report.subject]?.nameTh ?? ''}โดยรวม</h3>
          <strong style={{ fontSize: 26 }}>{Math.round(report.overallProgress * 100)}%</strong>
        </div>
        <ProgressBar value={report.overallProgress} />
        <div className="stats">
          <Stat value={`${report.stats.learningMinutesThisWeek} นาที`} label="เวลาเรียนสัปดาห์นี้" />
          <Stat value={report.stats.activitiesCompleted} label="กิจกรรมที่ทำเสร็จ" />
          <Stat value={`${report.stats.skillsMastered}/${report.stats.totalSkills}`} label="ทักษะที่เก่งแล้ว" />
          <Stat value={report.stats.bossesDefeated} label="บอสที่ปราบได้" />
        </div>
      </div>

      {report.insights.length > 0 && (
        <div className="card stack">
          <h3>คำแนะนำจากข้อมูลการเรียน</h3>
          {report.insights.map((i, k) => (
            <div key={k} className={`insight ${i.tone}`}>
              <span aria-hidden="true">{TONE_ICON[i.tone]}</span> {i.text}
            </div>
          ))}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <WeekChart days={report.week} />
        </div>
        <div className="card stack">
          <h3>ใช้เวลากับทักษะไหนมากที่สุด (14 วัน)</h3>
          {report.skillTime.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ทักษะ</th>
                  <th>นาที</th>
                  <th>ตอบถูก</th>
                </tr>
              </thead>
              <tbody>
                {report.skillTime.map((s) => (
                  <tr key={s.skillCode}>
                    <td>{s.nameTh}</td>
                    <td>{s.minutes > 0 ? s.minutes : '<1'}</td>
                    <td>{Math.round((s.correct / Math.max(s.attempts, 1)) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">ยังไม่มีข้อมูล</p>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card stack">
          <h3>✓ เก่งแล้ว</h3>
          {report.strong.length ? report.strong.map((s) => <div key={s.code}>✓ {s.nameTh}</div>) : <p className="muted">ยังไม่มี</p>}
        </div>
        <div className="card stack">
          <h3>△ ควรฝึกเพิ่ม</h3>
          {report.needPractice.length ? (
            report.needPractice.map((s) => (
              <div key={s.code}>
                △ {s.nameTh} <span className="muted">({STATUS_LABEL[s.status]} {Math.round(s.mastery * 100)}%)</span>
              </div>
            ))
          ) : (
            <p className="muted">ยังไม่มี</p>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card stack">
          <h3>🗺️ เส้นทางการเรียนต่อไป</h3>
          {goal && (
            <div className="muted">
              เป้าหมาย: {goal.emoji} {goal.label}
            </div>
          )}
          {report.currentPath.map((p, i) => (
            <div key={p.skillCode}>
              {i + 1}. {p.nameTh} {p.state === 'LOCKED' && <span className="muted">(ต้องฝึกพื้นฐานก่อน)</span>}
            </div>
          ))}
        </div>
        <div className="card stack">
          <h3>💖 ความสนใจ</h3>
          {student.interests.length ? (
            student.interests.map((i) => (
              <div key={i.theme} className="skill-row">
                <span>
                  {THEMES[i.theme].emoji} {THEMES[i.theme].label}
                </span>
                <ProgressBar value={i.level} />
                <span className="muted">{Math.round(i.score)}</span>
              </div>
            ))
          ) : (
            <p className="muted">ยังไม่ได้เลือก</p>
          )}
        </div>
      </div>

      <div className="card stack">
        <h3>🧠 แผนที่ทักษะ</h3>
        {groups.map((g) => (
          <div key={g} className="stack" style={{ gap: 6 }}>
            {started
              .filter((s) => s.group === g)
              .map((s) => (
                <div className="skill-row" key={s.code}>
                  <span>{s.nameTh}</span>
                  <ProgressBar value={s.mastery} tone={masteryTone(s.mastery)} />
                  <span className="muted">{Math.round(s.mastery * 100)}%</span>
                </div>
              ))}
          </div>
        ))}
        {started.length === 0 && <p className="muted">ยังไม่มีข้อมูล</p>}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
