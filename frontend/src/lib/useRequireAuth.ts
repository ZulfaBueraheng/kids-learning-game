'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { ApiError, tokenStore } from './api';

const noopSubscribe = () => () => {};

/** Redirects to the welcome page when there is no session. */
export function useRequireAuth(): boolean {
  const router = useRouter();
  // false on the server and during hydration, then the real value in the browser
  const hasToken = useSyncExternalStore(noopSubscribe, () => !!tokenStore.get(), () => false);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  useEffect(() => {
    if (hydrated && !hasToken) router.replace('/');
  }, [hydrated, hasToken, router]);
  return hasToken;
}

export function handleApiError(err: unknown, router: ReturnType<typeof useRouter>): string {
  if (err instanceof ApiError && err.status === 401) {
    router.replace('/');
    return 'กรุณาเข้าสู่ระบบอีกครั้ง';
  }
  if (err instanceof TypeError) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้งนะ';
  return err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
}
