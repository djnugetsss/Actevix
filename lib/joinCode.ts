/** Uppercase alphanumeric, ignores spaces and hyphens when matching. */
export function normalizeJoinCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/** Pretty display: ABC123 → ABC-123 */
export function formatJoinCodeDisplay(normalized: string): string {
  const n = normalizeJoinCode(normalized);
  if (n.length <= 3) return n;
  return `${n.slice(0, 3)}-${n.slice(3, 6)}${n.length > 6 ? n.slice(6) : ''}`;
}

function randomPick(chars: string, len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * Classroom-style code: XXX-NNN (letters + numbers, easy to read aloud).
 * `taken` is normalized codes (no hyphen).
 */
export function generateJoinCode(taken: Set<string>): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const alnum = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  for (let attempt = 0; attempt < 64; attempt++) {
    const partA = randomPick(letters, 3);
    const partB = randomPick(alnum, 3);
    const display = `${partA}-${partB}`;
    const norm = normalizeJoinCode(display);
    if (!taken.has(norm)) {
      taken.add(norm);
      return display;
    }
  }

  const fallback = `ACT-${randomPick(alnum, 4)}`;
  const n = normalizeJoinCode(fallback);
  taken.add(n);
  return fallback;
}
