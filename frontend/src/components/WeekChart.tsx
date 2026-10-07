/**
 * Minutes of learning per day for the last 7 days. One series, so no legend:
 * the title names it. Thin columns from a shared baseline, the busiest day is
 * labelled, every column has a hover/focus tooltip, and a table carries the
 * same numbers for screen readers.
 */
const DAY = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export function WeekChart({ days }: { days: { date: string; minutes: number }[] }) {
  const max = Math.max(...days.map((d) => d.minutes), 1);
  const peak = days.reduce((best, d) => (d.minutes > best.minutes ? d : best), days[0]);
  const total = days.reduce((s, d) => s + d.minutes, 0);
  const label = (date: string) => {
    const d = new Date(`${date}T00:00:00`);
    return {
      short: DAY[d.getDay()],
      long: d.toLocaleDateString('th-TH', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }),
    };
  };

  return (
    <figure className="week-chart">
      <figcaption>
        <strong>เวลาเรียนแต่ละวัน</strong> <span className="muted">· รวม {total} นาที ใน 7 วัน</span>
      </figcaption>
      {total === 0 ? (
        <div className="week-empty">ยังไม่มีเวลาเรียนใน 7 วันนี้</div>
      ) : (
        <div className="week-plot" aria-hidden="true">
          {days.map((d) => {
            const l = label(d.date);
            const showValue = d.minutes > 0 && d === peak;
            return (
              <div key={d.date} className="week-col" tabIndex={0}>
                <span className="week-tip">
                  {l.long}: {d.minutes} นาที
                </span>
                <div className="week-track">
                  {showValue && <span className="week-value">{d.minutes}</span>}
                  <span className="week-bar" style={{ height: `${(d.minutes / max) * 100}%` }} />
                </div>
                <span className="week-day">{l.short}</span>
              </div>
            );
          })}
        </div>
      )}
      <table className="sr-only">
        <caption>เวลาเรียนแต่ละวัน (นาที)</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th scope="row">{label(d.date).long}</th>
              <td>{d.minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
