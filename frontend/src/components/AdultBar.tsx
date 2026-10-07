'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adultTokenStore, type AdultUser } from '@/lib/api';

export function AdultBar({ user }: { user: AdultUser }) {
  const router = useRouter();
  const home = user.role === 'PARENT' ? '/parent' : '/teacher';
  return (
    <header className="topbar adult no-print">
      <Link href={home} className="who" style={{ fontWeight: 700 }}>
        {user.role === 'PARENT' ? '👨‍👩‍👧 ผู้ปกครอง' : '👩‍🏫 คุณครู'} · {user.displayName}
      </Link>
      <nav>
        <button
          className="btn secondary"
          onClick={() => {
            adultTokenStore.clear();
            router.replace('/grown-ups');
          }}
        >
          ออกจากระบบ
        </button>
      </nav>
    </header>
  );
}
