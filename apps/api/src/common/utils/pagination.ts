export function parsePage(raw?: string, fallback = 1): number {
  const value = raw ? parseInt(raw, 10) : fallback;
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
}

export function parseLimit(raw?: string, fallback = 12, max = 100): number {
  const value = raw ? parseInt(raw, 10) : fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), max);
}
