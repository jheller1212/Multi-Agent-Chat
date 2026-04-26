import { describe, it, expect } from 'vitest';
import { hashString } from '../hash';

describe('hashString', () => {
  it('returns an 8-character hex string', () => {
    const result = hashString('test');
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is deterministic', () => {
    expect(hashString('hello')).toBe(hashString('hello'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashString('abc')).not.toBe(hashString('xyz'));
  });

  it('handles empty string', () => {
    const result = hashString('');
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });

  it('handles unicode', () => {
    const result = hashString('über 日本語');
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });
});
