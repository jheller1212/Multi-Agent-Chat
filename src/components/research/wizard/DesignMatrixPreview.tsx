import { Card, CardTitle } from '../../ui/Card';
import type { FactorDefinition } from '../../../types/experiment';

interface DesignMatrixPreviewProps {
  factors: FactorDefinition[];
  nPerCell: number;
  bufferPercent: number;
  /** LLM calls per dyad, estimated from the scenario (turn cap × speakers + supervisors). */
  callsPerDyad: number;
}

const MAX_ROWS = 24;

/** Enumerate the cartesian product of factor levels as cell labels. */
export function enumerateCells(factors: FactorDefinition[]): string[] {
  const active = factors.filter(f => f.name.trim() && f.levels.length > 0);
  if (active.length === 0) return [];
  return active.reduce<string[]>(
    (acc, factor) =>
      acc.flatMap(prefix => factor.levels.map(level => (prefix ? `${prefix} × ${level}` : level))),
    [''],
  );
}

/** Sticky live preview of the experiment design matrix. */
export function DesignMatrixPreview({ factors, nPerCell, bufferPercent, callsPerDyad }: DesignMatrixPreviewProps) {
  const cells = enumerateCells(factors);
  const dyads = cells.length * nPerCell;
  const buffered = Math.ceil(dyads * (1 + bufferPercent / 100));
  const estCalls = buffered * callsPerDyad;

  return (
    <Card className="sticky top-6">
      <CardTitle>Design matrix</CardTitle>
      {cells.length === 0 ? (
        <p className="mt-3 text-callout text-label-3">Add a factor with at least one level to see cells.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-sm border border-separator-opaque">
          <table className="w-full">
            <thead>
              <tr className="border-b border-separator-opaque bg-bg-sunken">
                <th className="px-2.5 py-1.5 text-left text-caption text-label-2">Cell</th>
                <th className="px-2.5 py-1.5 text-right text-caption text-label-2">Dyads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {cells.slice(0, MAX_ROWS).map(cell => (
                <tr key={cell}>
                  <td className="max-w-0 truncate px-2.5 py-1.5 text-callout text-label-1" title={cell}>{cell}</td>
                  <td className="tnum px-2.5 py-1.5 text-right font-mono text-mono-data text-label-2">{nPerCell}</td>
                </tr>
              ))}
              {cells.length > MAX_ROWS && (
                <tr>
                  <td colSpan={2} className="px-2.5 py-1.5 text-caption font-normal text-label-3">
                    +{cells.length - MAX_ROWS} more cells
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <dl className="tnum mt-4 flex flex-col gap-1.5 font-mono text-mono-data">
        <TotalRow label="Cells" value={cells.length} />
        <TotalRow label="Dyads" value={dyads} />
        <TotalRow label={`With ${bufferPercent}% buffer`} value={buffered} />
        <div className="my-1 border-t border-separator" />
        <TotalRow label="Est. LLM calls" value={estCalls} emphasize />
      </dl>
    </Card>
  );
}

function TotalRow({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="font-sans text-caption font-normal text-label-2">{label}</dt>
      <dd className={emphasize ? 'text-label-1' : 'text-label-2'}>{value.toLocaleString('en-US')}</dd>
    </div>
  );
}
