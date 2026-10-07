'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { AdultBar } from '@/components/AdultBar';
import { Loading } from '@/components/bits';
import { ReportView } from '@/components/ReportView';
import { adultApi, type StudentReport } from '@/lib/api';
import { adultError, useAdult } from '@/lib/useAdult';

export default function TeacherStudentPage({ params }: { params: Promise<{ id: string; studentId: string }> }) {
  const { id, studentId } = use(params);
  const user = useAdult('TEACHER');
  const router = useRouter();
  const [report, setReport] = useState<StudentReport | null>(null);
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    adultApi
      .studentReport(id, studentId, subject || undefined)
      .then(setReport)
      .catch((err) => setError(adultError(err, router)));
  }, [user, id, studentId, subject, router]);

  const remove = async () => {
    if (!report || !confirm(`นำ ${report.student.nickname} ออกจากห้อง?`)) return;
    try {
      await adultApi.removeStudent(id, studentId);
      router.replace(`/teacher/class/${id}`);
    } catch (err) {
      setError(adultError(err, router));
    }
  };

  if (!user) return <Loading />;
  return (
    <>
      <AdultBar user={user} />
      <main className="page stack">
        <Link href={`/teacher/class/${id}`} className="muted no-print">
          ← กลับไปที่ห้องเรียน
        </Link>
        {error && <div className="error">{error}</div>}
        {report ? (
          <ReportView
            report={report}
            onSubject={setSubject}
            actions={
              <button className="btn secondary" onClick={remove}>
                นำออกจากห้อง
              </button>
            }
          />
        ) : (
          !error && <Loading />
        )}
      </main>
    </>
  );
}
