import { hashPassword, LoginThrottle, verifyPassword } from './password.js';

describe('passwords', () => {
  it('hashes with a random salt and verifies', () => {
    const a = hashPassword('correct horse');
    const b = hashPassword('correct horse');
    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('correct horse', a)).toBe(true);
    expect(verifyPassword('wrong horse', a)).toBe(false);
    expect(verifyPassword('x', null)).toBe(false);
    expect(verifyPassword('x', 'garbage')).toBe(false);
  });

  it('locks after repeated failures and unlocks later', () => {
    const t = new LoginThrottle(3, 1000);
    t.fail('a', 0);
    t.fail('a', 0);
    expect(t.isLocked('a', 0)).toBe(false);
    t.fail('a', 0);
    expect(t.isLocked('a', 500)).toBe(true);
    expect(t.isLocked('a', 1500)).toBe(false);
    t.fail('a', 1500); // counting starts over after the lock
    expect(t.isLocked('a', 1500)).toBe(false);
    t.succeed('a');
    expect(t.isLocked('a', 1500)).toBe(false);
  });
});
