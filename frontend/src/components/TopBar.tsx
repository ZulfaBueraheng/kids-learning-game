'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CharacterLook, LevelInfo, Student } from '@/lib/api';
import { Character } from './Character';
import { XpBar } from './bits';

export function TopBar({ student, level, character }: { student: Student; level: LevelInfo; character: CharacterLook }) {
  const pathname = usePathname();
  const link = (href: string, icon: string, label: string) => (
    <Link href={href} className={pathname.startsWith(href) ? 'active' : undefined}>
      {icon} <span className="nav-label">{label}</span>
    </Link>
  );
  return (
    <header className="topbar">
      <div className="who">
        <Character look={character} size={30} />
        <div>
          <div style={{ fontWeight: 700 }}>{student.nickname}</div>
          <div className="muted" style={{ fontSize: 14 }}>
            เลเวล {level.level} · 🪙 {student.coins}
          </div>
        </div>
      </div>
      <div className="xp">
        <XpBar xp={student.xp} level={level} />
      </div>
      <nav>
        {link('/map', '🌎', 'แผนที่')}
        {link('/shop', '🛍️', 'ร้านค้า')}
        {link('/dashboard', '📊', 'ความก้าวหน้า')}
      </nav>
    </header>
  );
}
