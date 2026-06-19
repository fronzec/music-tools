import type { ViewName } from '$lib/types/chord';

/**
 * Canonical runtime list of every ViewName value.
 * ORDER is irrelevant; COVERAGE is enforced by the compile-time guards below.
 */
export const VIEW_NAMES = [
  'home',
  'caged',
  'progression',
  'note-trainer',
  'tone-generator',
  'pentatonic',
  'signal-lab',
  'interval-trainer',
  'tab-player',
  'chord-builder',
  'diatonic-harmonizer',
] as const;

// --- Compile-time sync guard (no runtime cost) ---
// 1. The array must contain ONLY ViewName members (catches typos / stale entries).
type _ArrayIsSubsetOfUnion = (typeof VIEW_NAMES)[number] extends ViewName ? true : never;
// 2. The array must contain EVERY ViewName member (catches a forgotten new tool).
//    If a ViewName is missing from VIEW_NAMES, `Exclude<...>` is non-never and this fails tsc.
type _UnionIsSubsetOfArray =
  Exclude<ViewName, (typeof VIEW_NAMES)[number]> extends never ? true : never;
// Force evaluation; either failing produces a `tsc` error at this line.
const _viewNamesExhaustive: [_ArrayIsSubsetOfUnion, _UnionIsSubsetOfArray] = [true, true];
void _viewNamesExhaustive;

export const HOME_PATH = '/';

const VIEW_NAME_SET: ReadonlySet<string> = new Set(VIEW_NAMES);

function isViewName(value: string): value is ViewName {
  return VIEW_NAME_SET.has(value);
}

/**
 * Maps a ViewName to a URL pathname.
 * - 'home' → '/'
 * - any other ViewName → '/' + view
 * Total pure function, never throws.
 */
export function viewToPath(view: ViewName): string {
  return view === 'home' ? HOME_PATH : `/${view}`;
}

/**
 * Resolves a URL pathname to a ViewName.
 * - '/'        → 'home'
 * - '/caged'   → 'caged'
 * - '/caged/'  → 'caged'   (trailing slash tolerated)
 * - '//caged'  → 'caged'   (multiple leading slashes tolerated)
 * - '/unknown' → 'home'    (unknown-path fallback)
 * - ''         → 'home'    (empty string fallback)
 * Total pure function, never throws.
 */
export function pathToView(pathname: string): ViewName {
  const segment = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (segment === '') return 'home';
  return isViewName(segment) ? segment : 'home';
}
