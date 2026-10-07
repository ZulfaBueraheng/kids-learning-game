'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loading } from '@/components/bits';
import { Character } from '@/components/Character';
import { TopBar } from '@/components/TopBar';
import { api, type Achievement, type Dashboard, type ItemSlot, type Shop, type ShopItem } from '@/lib/api';
import { handleApiError, useRequireAuth } from '@/lib/useRequireAuth';

const SLOTS: { slot: ItemSlot; label: string }[] = [
  { slot: 'HAT', label: '🎩 หมวก' },
  { slot: 'OUTFIT', label: '👕 เสื้อผ้า' },
  { slot: 'PET', label: '🐶 สัตว์เลี้ยง' },
  { slot: 'ACCESSORY', label: '🎒 เครื่องประดับ' },
];

const AVATARS = ['🦁', '🐯', '🐼', '🐰', '🦊', '🐸', '🐵', '🦄', '🐲', '🐧', '🐨', '🐙'];

export default function ShopPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [slot, setSlot] = useState<ItemSlot>('HAT');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [earned, setEarned] = useState<Achievement[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    Promise.all([api.shop(), api.dashboard()])
      .then(([s, d]) => {
        setShop(s);
        setDash(d);
      })
      .catch((err) => setError(handleApiError(err, router)));
  }, [ready, router]);

  const act = async (fn: () => Promise<Shop>, done?: (s: Shop) => string) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const next = await fn();
      setShop(next);
      setEarned(next.newAchievements ?? []);
      if (done) setMessage(done(next));
      if (dash) setDash({ ...dash, character: next.character, student: { ...dash.student, coins: next.coins } });
    } catch (err) {
      setError(handleApiError(err, router));
    } finally {
      setBusy(false);
    }
  };

  if (!shop || !dash) return error ? <main className="page"><div className="error">{error}</div></main> : <Loading />;

  const items = shop.items.filter((i) => i.slot === slot);
  const owned = shop.items.filter((i) => i.owned).length;

  return (
    <>
      <TopBar student={dash.student} level={dash.level} character={shop.character} />
      <main className="page stack">
        <div className="card shop-hero">
          <Character look={shop.character} size={88} />
          <div className="stack" style={{ gap: 8, flex: 1 }}>
            <h1>ร้านค้าของ {dash.student.nickname}</h1>
            <div className="coins">🪙 {shop.coins} เหรียญ</div>
            <p className="muted" style={{ margin: 0 }}>
              เล่นด่านเพื่อสะสมเหรียญ ปราบบอสเพื่อรับของสะสมพิเศษ · มีของแล้ว {owned}/{shop.items.length} ชิ้น
            </p>
          </div>
        </div>

        {message && <div className="feedback good center">{message}</div>}
        {earned.length > 0 && (
          <div className="card row">
            {earned.map((a) => (
              <span key={a.code}>
                {a.emoji} <strong>{a.name}</strong>
              </span>
            ))}
          </div>
        )}
        {error && <div className="error">{error}</div>}

        <div className="card stack">
          <h3>เปลี่ยนหน้าตัวละคร</h3>
          <div className="avatar-pick">
            {AVATARS.map((a) => (
              <button
                key={a}
                aria-pressed={a === shop.character.avatar}
                disabled={busy}
                onClick={() => act(() => api.setAvatar(a))}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="tabs" role="tablist">
          {SLOTS.map((s) => (
            <button key={s.slot} role="tab" aria-selected={s.slot === slot} onClick={() => setSlot(s.slot)}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="shop-grid">
          {items.map((item) => (
            <ItemCard
              key={item.code}
              item={item}
              coins={shop.coins}
              busy={busy}
              onBuy={() => act(() => api.buy(item.code), () => `ได้ ${item.emoji} ${item.name} แล้ว!`)}
              onEquip={(on) => act(() => api.equip(item.code, on))}
            />
          ))}
        </div>
      </main>
    </>
  );
}

function ItemCard({
  item,
  coins,
  busy,
  onBuy,
  onEquip,
}: {
  item: ShopItem;
  coins: number;
  busy: boolean;
  onBuy: () => void;
  onEquip: (on: boolean) => void;
}) {
  const lockedReward = !item.owned && item.price == null;
  return (
    <div className={`shop-item${item.equipped ? ' equipped' : ''}${lockedReward ? ' locked' : ''}`}>
      <div className="emoji">{lockedReward ? '❔' : item.emoji}</div>
      <strong>{lockedReward ? 'ของสะสมลับ' : item.name}</strong>
      {item.owned ? (
        <button className={item.equipped ? 'btn secondary' : 'btn'} disabled={busy} onClick={() => onEquip(!item.equipped)}>
          {item.equipped ? 'ถอดออก' : 'สวมใส่'}
        </button>
      ) : item.price == null ? (
        <span className="muted" style={{ fontSize: 14 }}>
          🏆 ปราบบอส{item.rewardFrom ? `แห่ง${item.rewardFrom}` : ''}
        </span>
      ) : (
        <button className="btn" disabled={busy || coins < item.price} onClick={onBuy}>
          🪙 {item.price}
        </button>
      )}
      {!item.owned && item.price != null && coins < item.price && (
        <span className="muted" style={{ fontSize: 13 }}>
          ขาดอีก {item.price - coins} เหรียญ
        </span>
      )}
    </div>
  );
}
