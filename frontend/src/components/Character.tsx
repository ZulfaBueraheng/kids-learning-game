import type { CharacterLook } from '@/lib/api';

/** The child's character: avatar with hat, outfit, pet and accessory layered around it. */
export function Character({ look, size = 48 }: { look: CharacterLook; size?: number }) {
  const small = size * 0.45;
  return (
    <div
      className="character"
      style={{ width: size * 1.5, height: size * 1.5, fontSize: size }}
      aria-label={['ตัวละคร', look.HAT?.name, look.OUTFIT?.name, look.PET?.name, look.ACCESSORY?.name].filter(Boolean).join(' ')}
    >
      <span className="base">{look.avatar}</span>
      {look.HAT && (
        <span className="hat" style={{ fontSize: size * 0.55 }}>
          {look.HAT.emoji}
        </span>
      )}
      {look.OUTFIT && (
        <span className="outfit" style={{ fontSize: small }}>
          {look.OUTFIT.emoji}
        </span>
      )}
      {look.PET && (
        <span className="pet" style={{ fontSize: small }}>
          {look.PET.emoji}
        </span>
      )}
      {look.ACCESSORY && (
        <span className="accessory" style={{ fontSize: small }}>
          {look.ACCESSORY.emoji}
        </span>
      )}
    </div>
  );
}
