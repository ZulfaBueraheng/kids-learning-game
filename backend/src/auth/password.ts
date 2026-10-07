import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

/** scrypt with a random salt, stored as "scrypt$<salt>$<hash>". */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Locks a key (email or child code) for a while after repeated failures. In-memory, per process. */
export class LoginThrottle {
  private readonly failures = new Map<string, { count: number; lockedUntil: number }>();

  constructor(
    private readonly maxFailures = 5,
    private readonly lockMs = 15 * 60 * 1000,
  ) {}

  isLocked(key: string, now = Date.now()): boolean {
    const f = this.failures.get(key);
    return !!f && f.lockedUntil > now;
  }

  fail(key: string, now = Date.now()): void {
    const f = this.failures.get(key) ?? { count: 0, lockedUntil: 0 };
    if (f.lockedUntil && f.lockedUntil <= now) f.count = 0; // lock expired: start over
    f.count += 1;
    if (f.count >= this.maxFailures) f.lockedUntil = now + this.lockMs;
    this.failures.set(key, f);
  }

  succeed(key: string): void {
    this.failures.delete(key);
  }
}
