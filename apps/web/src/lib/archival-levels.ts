/**
 * The archival hierarchy, outermost first - the same order the API enforces.
 * A unit hangs off a parent exactly one step above it, which is what lets the
 * form offer the right parents for whichever level is being created. Only a
 * fonds stands on its own.
 */
export const ARCHIVAL_LEVELS = ['fonds', 'sub_fonds', 'series', 'sub_series', 'file', 'collection'] as const;

export type ArchivalLevel = (typeof ARCHIVAL_LEVELS)[number];

export const ARCHIVAL_LEVEL_LABELS: Record<ArchivalLevel, [string, string]> = {
  fonds: ['رصيد', 'Fonds'],
  sub_fonds: ['رصيد فرعي', 'Sub-fonds'],
  series: ['سلسلة', 'Series'],
  sub_series: ['سلسلة فرعية', 'Sub-series'],
  file: ['ملف', 'File'],
  collection: ['مجموعة', 'Collection'],
};

export function levelDepth(level: string): number {
  return (ARCHIVAL_LEVELS as readonly string[]).indexOf(level);
}

/** The level a unit at `level` must hang off, or null if it stands alone. */
export function parentLevelOf(level: string): ArchivalLevel | null {
  const depth = levelDepth(level);
  return depth > 0 ? ARCHIVAL_LEVELS[depth - 1] : null;
}

/** Label for a level, including ones written before this list settled. */
export function levelLabel(level: string, arabic: boolean): string {
  const pair = ARCHIVAL_LEVEL_LABELS[level as ArchivalLevel];
  return pair ? pair[arabic ? 0 : 1] : level;
}
