'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { AdultBar } from '@/components/AdultBar';
import { Loading } from '@/components/bits';
import { ReportView } from '@/components/ReportView';
import { adultApi, type AccessLogEntry, type StudentReport } from '@/lib/api';
import { adultError, useAdult } from '@/lib/useAdult';

const ACTION_LABEL: Record<string, string> = {
  PARENT_LINK_CHILD: 'ผู้ปกครองเชื่อมต่อบัญชี',
  PARENT_UNLINK_CHILD: 'ผู้ปกครองยกเลิกการเชื่อมต่อ',
  PARENT_REMOVE_FROM_CLASS: 'ผู้ปกครองนำออกจากห้องเรียน',
  CLASS_JOIN: 'เข้าร่วมห้องเรียน',
  CLASS_REMOVE_STUDENT: 'คุณครูนำออกจากห้องเรียน',
  REPORT_VIEW: 'เปิดดูรายงาน',
};

export default function ChildReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAdult('PARENT');
  const router = useRouter();
  const [report, setReport] = useState<StudentReport | null>(null);
  const [log, setLog] = useState<AccessLogEntry[]>([]);
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([adultApi.childReport(id, subject || undefined), adultApi.childAccessLog(id)])
      .then(([r, l]) => {
        setReport(r);
        setLog(l);
      })
      .catch((err) => setError(adultError(err, router)));
  }, [user, id, subject, router]);

  const removeFromClass = async (classroomId: string, name: string) => {
    if (!confirm(`นำลูกออกจากห้อง "${name}"? คุณครูของห้องนี้จะไม่เห็นข้อมูลของลูกอีก`)) return;
    try {
      await adultApi.removeChildFromClass(id, classroomId);
      setReport(await adultApi.childReport(id, subject || undefined));
      setLog(await adultApi.childAccessLog(id));
    } catch (err) {
      setError(adultError(err, router));
    }
  };

  const unlink = async () => {
    if (!confirm('ยกเลิกการเชื่อมต่อกับบัญชีนี้?')) return;
    try {
      await adultApi.unlinkChild(id);
      router.replace('/parent');
    } catch (err) {
      setError(adultError(err, router));
    }
  };

  if (!user) return <Loading />;
  if (error) {
    return (
      <main className="page stack">
        <div className="error">{error}</div>
        <Link href="/parent">← กลับ</Link>
      </main>
    );
  }
  if (!report) return <Loading />;

  return (
    <>
      <AdultBar user={user} />
      <main className="page stack">
        <Link href="/parent" className="muted no-print">
          ← ลูกของฉัน
        </Link>
        <ReportView report={report} onSubject={setSubject} />

        <div className="grid-2 no-print">
          <div className="card stack">
            <h3>🔒 ใครเห็นข้อมูลของลูกบ้าง</h3>
            <div>👨‍👩‍👧 คุณ (ผู้ปกครอง)</div>
            {report.classrooms.map((c) => (
              <div key={c.id} className="row" style={{ justifyContent: 'space-between' }}>
                <span>
                  👩‍🏫 {c.teacher} · ห้อง {c.name}
                </span>
                <button className="btn secondary" onClick={() => removeFromClass(c.id, c.name)}>
                  นำออกจากห้อง
                </button>
              </div>
            ))}
            {report.classrooms.length === 0 && <p className="muted" style={{ margin: 0 }}>ยังไม่ได้อยู่ในห้องเรียนใด</p>}
            <button className="btn secondary" style={{ alignSelf: 'flex-start' }} onClick={unlink}>
              ยกเลิกการเชื่อมต่อบัญชีนี้
            </button>
          </div>
          <div className="card stack">
            <h3>📜 บันทึกการเข้าถึงข้อมูล</h3>
            <div className="access-log">
              {log.map((l, i) => (
                <div key={i} className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                  <span>
                    {ACTION_LABEL[l.action] ?? l.action}
                    {l.by && (
                      <span className="muted">
                        {' '}
                        · {l.by.role === 'TEACHER' ? 'คุณครู' : l.by.role === 'PARENT' ? 'ผู้ปกครอง' : ''} {l.by.name}
                      </span>
                    )}
                  </span>
                  <span className="muted" style={{ fontSize: 14 }}>
                    {new Date(l.at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
