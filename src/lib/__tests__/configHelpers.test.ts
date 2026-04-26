import { describe, it, expect } from 'vitest';
import { sc, scNum, scBool } from '../configHelpers';

describe('sc', () => {
  it('extracts string values', () => {
    expect(sc({ key: 'value' }, 'key')).toBe('value');
  });

  it('returns undefined for non-string values', () => {
    expect(sc({ key: 42 }, 'key')).toBeUndefined();
    expect(sc({ key: true }, 'key')).toBeUndefined();
  });

  it('returns undefined for missing keys', () => {
    expect(sc({}, 'missing')).toBeUndefined();
  });

  it('returns undefined when config is undefined', () => {
    expect(sc(undefined, 'key')).toBeUndefined();
  });
});

describe('scNum', () => {
  it('extracts number values', () => {
    expect(scNum({ t: 0.7 }, 't')).toBe(0.7);
  });

  it('returns undefined for non-number values', () => {
    expect(scNum({ t: '0.7' }, 't')).toBeUndefined();
  });
});

describe('scBool', () => {
  it('extracts boolean values', () => {
    expect(scBool({ flag: true }, 'flag')).toBe(true);
    expect(scBool({ flag: false }, 'flag')).toBe(false);
  });

  it('returns undefined for non-boolean values', () => {
    expect(scBool({ flag: 'true' }, 'flag')).toBeUndefined();
  });
});
