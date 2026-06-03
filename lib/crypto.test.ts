import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './crypto';

describe('encrypt / decrypt', () => {
  it('round-trips a string', () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32-byte hex
    const plaintext = 'sk-abc123supersecret';
    const ciphertext = encrypt(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it('produces different ciphertext each time (random IV)', () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    const a = encrypt('same');
    const b = encrypt('same');
    expect(a).not.toBe(b);
  });
});
