import { describe, it, expect } from 'vitest';
import { enumerateCells, computeTotalDyads } from '../cell-enumerator';

describe('enumerateCells', () => {
  it('produces 4 cells for 2x2 design', () => {
    const cells = enumerateCells([
      { name: 'buyer', levels: ['strong', 'weak'] },
      { name: 'seller', levels: ['strong', 'weak'] },
    ]);
    expect(cells).toHaveLength(4);
    expect(cells[0].factors).toEqual({ buyer: 'strong', seller: 'strong' });
    expect(cells[3].factors).toEqual({ buyer: 'weak', seller: 'weak' });
  });

  it('produces 8 cells for 2x2x2 design', () => {
    const cells = enumerateCells([
      { name: 'cap', levels: ['sym', 'asym'] },
      { name: 'bw', levels: ['high', 'low'] },
      { name: 'sw', levels: ['high', 'low'] },
    ]);
    expect(cells).toHaveLength(8);
  });

  it('returns single default cell for no factors', () => {
    const cells = enumerateCells([]);
    expect(cells).toHaveLength(1);
    expect(cells[0].label).toBe('default');
  });
});

describe('computeTotalDyads', () => {
  it('computes E1 total (4 cells × 158)', () => {
    const total = computeTotalDyads(
      [{ name: 'buyer', levels: ['strong', 'weak'] }, { name: 'seller', levels: ['strong', 'weak'] }],
      150, 5,
    );
    expect(total).toBe(4 * 158);
  });
});
