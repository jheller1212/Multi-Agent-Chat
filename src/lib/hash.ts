/**
 * djb2 hash — returns an 8-character lowercase hex string.
 * Used for system-prompt version tracking in CSV exports
 * (reproducible across runs, no crypto dependency needed).
 */
export function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash.toString(16).padStart(8, '0');
}
