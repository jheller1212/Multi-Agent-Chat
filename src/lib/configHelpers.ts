/** Safely pull typed values from a sharedConfig object. */

export function sc(cfg: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = cfg?.[key];
  return typeof v === 'string' ? v : undefined;
}

export function scNum(cfg: Record<string, unknown> | undefined, key: string): number | undefined {
  const v = cfg?.[key];
  return typeof v === 'number' ? v : undefined;
}

export function scBool(cfg: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const v = cfg?.[key];
  return typeof v === 'boolean' ? v : undefined;
}
