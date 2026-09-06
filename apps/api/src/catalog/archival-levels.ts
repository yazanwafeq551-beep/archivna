/**
 * The archival hierarchy, outermost first. A unit may only hang off a parent
 * exactly one step above it, which is what lets the UI offer the right list of
 * parents for whatever level is being created.
 *
 * Only a fonds stands on its own. "Collection" used to be a second root; it is
 * now the innermost aggregation, inside a file. Units created before that are
 * left where they are - the rule is checked when a unit is written, not read.
 */
export const ARCHIVAL_LEVELS = ['fonds', 'sub_fonds', 'series', 'sub_series', 'file', 'collection'] as const;

export type ArchivalLevel = (typeof ARCHIVAL_LEVELS)[number];

export const ROOT_LEVEL: ArchivalLevel = ARCHIVAL_LEVELS[0];

/** Depth of a level, or -1 for one this version does not know. */
export function levelDepth(level: string): number {
  return (ARCHIVAL_LEVELS as readonly string[]).indexOf(level);
}

/** The level a unit at `level` must hang off, or null if it stands alone. */
export function parentLevelOf(level: string): ArchivalLevel | null {
  const depth = levelDepth(level);
  return depth > 0 ? ARCHIVAL_LEVELS[depth - 1] : null;
}
