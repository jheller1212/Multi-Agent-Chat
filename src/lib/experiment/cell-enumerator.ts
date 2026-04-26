import type { FactorDefinition } from '../../types/experiment';

export interface CellDefinition {
  label: string;
  factors: Record<string, string>;
}

/**
 * Enumerate all cells from a set of factors by computing the Cartesian product of their levels.
 * E.g., factors [{buyer: [strong, weak]}, {seller: [strong, weak]}] → 4 cells.
 */
export function enumerateCells(factors: FactorDefinition[]): CellDefinition[] {
  if (factors.length === 0) return [{ label: 'default', factors: {} }];

  const cells: CellDefinition[] = [];

  function recurse(index: number, current: Record<string, string>) {
    if (index === factors.length) {
      const label = factors.map(f => current[f.name]).join('_');
      cells.push({ label, factors: { ...current } });
      return;
    }

    const factor = factors[index];
    for (const level of factor.levels) {
      recurse(index + 1, { ...current, [factor.name]: level });
    }
  }

  recurse(0, {});
  return cells;
}

/**
 * Compute the total number of dyads for an experiment.
 */
export function computeTotalDyads(
  factors: FactorDefinition[],
  targetNPerCell: number,
  bufferPercent: number,
): number {
  const cellCount = enumerateCells(factors).length;
  const nPerCell = Math.ceil(targetNPerCell * (1 + bufferPercent / 100));
  return cellCount * nPerCell;
}
