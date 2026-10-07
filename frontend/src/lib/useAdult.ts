'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { adultApi, adultTokenStore, ApiError, type AdultRole, type AdultUser } from './api';

const noopSubscribe = () => () => {};

/** Loads the signed-in parent/teacher; sends anyone else to the grown-ups sign-in page. */
export function useAdult(role: AdultRole): AdultUser | null {
  const router = useRouter();
  const hasToken = useSyncExternalStore(noopSubscribe, () => !!adultTokenStore.get(), () => false);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [user, setUser] = useState<AdultUser | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!hasToken) {
      router.replace('/grown-ups');
      return;
    }
    adultApi
      .me()
      .then((me) => {
        if (me.role !== role) router.replace(me.role === 'PARENT' ? '/parent' : '/teacher');
        else setUser(me);
      })
      .catch(() => router.replace('/grown-ups'));
  }, [hydrated, hasToken, role, router]);

  return user;
}

export function adultError(err: unknown, router: ReturnType<typeof useRouter>): string {
  if (err instanceof ApiError && err.status === 401) {
    router.replace('/grown-ups');
    return 'กรุณาเข้าสู่ระบบอีกครั้ง';
  }
  if (err instanceof TypeError) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง';
  return err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
}
