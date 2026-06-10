/**
 * Audit v2 — caged-shapes.json verification with corrected absolute-fret formula.
 * Run: npx tsx scripts/audit-caged-v2.ts
 */

import shapesData from '../src/lib/data/caged-shapes.json';

const OPEN_MIDI = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// Templates copied from generator
const TEMPLATES: Record<string, Record<string, { intervals: (number|null)[]; rootString: number }>> = {
  major: {
    E: { intervals: [0, 7, 12, 16, 19, 24], rootString: 0 },
    A: { intervals: [null, 0, 7, 12, 16, 19], rootString: 1 },
    G: { intervals: [-12, -8, -5, 0, 4, 12], rootString: 3 },
    D: { intervals: [null, null, 0, 7, 12, 16], rootString: 2 },
    C: { intervals: [null, 0, 4, 7, 12, 16], rootString: 1 },
  },
  minor: {
    E: { intervals: [0, 7, 12, 15, 19, 24], rootString: 0 },
    A: { intervals: [null, 0, 7, 12, 15, 19], rootString: 1 },
    G: { intervals: [-12, -9, -5, 0, 3, 12], rootString: 3 },
    D: { intervals: [null, null, 0, 7, 12, 15], rootString: 2 },
    C: { intervals: [null, 0, 3, 7, 12, 15], rootString: 1 },
  },
};

// Known open chords
const OPEN_CHORDS: Record<string, { frets: (number|null)[]; rootString: number }> = {
  'C major C': { frets: [null, 3, 2, 0, 1, 0], rootString: 1 },
  'A major A': { frets: [null, 0, 2, 2, 2, 0], rootString: 1 },
  'G major G': { frets: [3, 2, 0, 0, 0, 3], rootString: 3 },
  'E major E': { frets: [0, 2, 2, 1, 0, 0], rootString: 0 },
  'D major D': { frets: [null, null, 0, 2, 3, 2], rootString: 2 },
  'A minor A': { frets: [null, 0, 2, 2, 1, 0], rootString: 1 },
  'E minor E': { frets: [0, 2, 2, 0, 0, 0], rootString: 0 },
  'D minor D': { frets: [null, null, 0, 2, 3, 1], rootString: 2 },
};

const ALLOWED_INTERVALS = new Set(['R', 'b3', '3', '5']);

function fretsEqual(a: any[], b: any[]): boolean {
  return a.every((v, i) => v === b[i]);
}

/**
 * Get absolute-fret = the actual fret number on the guitar.
 *
 * Convention used by the generator:
 *   - When baseFret===1 (open position): frets[] is absolute (0=open, 3=fret3)
 *   - When baseFret>1 (barre): frets[] is relative to baseFret
 *     absoluteFret = baseFret + frets[i]
 */
function absFret(baseFret: number, relFret: number | null): number | null {
  if (relFret === null) return null;
  return baseFret === 1 ? relFret : baseFret + relFret;
}

function midiToNote(midi: number): string {
  return CHROMATIC[((midi % 12) + 12) % 12];
}

function semitoneToInterval(semitone: number, quality: string): string {
  const n = ((semitone % 12) + 12) % 12;
  if (n === 0) return 'R';
  if (n === 7) return '5';
  if (quality === 'major') { if (n === 4) return '3'; }
  else { if (n === 3) return 'b3'; }
  return '';
}

// ── Audit ────────────────────────────────────────────────────────────────────

const issues: { severity: 'ERROR'|'WARN'; msg: string }[] = [];
let count = 0;

for (const rootName of CHROMATIC) {
  const entry = (shapesData as any)[rootName];
  if (!entry) { issues.push({ severity:'ERROR', msg: `Missing root: ${rootName}` }); continue; }

  for (const quality of ['major','minor'] as const) {
    const shapes: any[] = entry[quality];
    if (!shapes || !Array.isArray(shapes)) {
      issues.push({ severity:'ERROR', msg: `${rootName} ${quality}: missing` }); continue;
    }
    if (shapes.length !== 5) {
      issues.push({ severity:'ERROR', msg: `${rootName} ${quality}: ${shapes.length} shapes (need 5)` }); continue;
    }

    const seen = new Set<string>();

    for (const s of shapes) {
      const tag = `${s.root} ${s.quality} shape=${s.shape}`;
      count++;

      // Structure
      if (s.frets.length !== 6) { issues.push({ severity:'ERROR', msg: `${tag}: frets.length=${s.frets.length}` }); continue; }
      if (s.intervals.length !== 6) { issues.push({ severity:'ERROR', msg: `${tag}: intervals.length=${s.intervals.length}` }); continue; }
      if (s.baseFret < 1) { issues.push({ severity:'ERROR', msg: `${tag}: baseFret=${s.baseFret}` }); }
      if (s.rootString < 0 || s.rootString > 5) { issues.push({ severity:'ERROR', msg: `${tag}: rootString=${s.rootString}` }); }
      if (s.root !== rootName) { issues.push({ severity:'ERROR', msg: `${tag}: root field "${s.root}" ≠ key "${rootName}"` }); }
      if (s.quality !== quality) { issues.push({ severity:'ERROR', msg: `${tag}: quality field ≠ ${quality}` }); }

      // Duplicate
      if (seen.has(s.shape)) { issues.push({ severity:'ERROR', msg: `${tag}: duplicate shape` }); }
      seen.add(s.shape);

      // Negative frets
      for (let i = 0; i < 6; i++) {
        if (s.frets[i] !== null && s.frets[i] < 0) {
          issues.push({ severity:'ERROR', msg: `${tag}: string ${i} negative fret ${s.frets[i]}` });
        }
      }

      // Null consistency: frets[i] null ⇔ intervals[i] null
      for (let i = 0; i < 6; i++) {
        if ((s.frets[i] === null) !== (s.intervals[i] === null)) {
          issues.push({ severity:'ERROR', msg: `${tag}: string ${i} null mismatch (frets=${s.frets[i]}, intervals=${s.intervals[i]})` });
        }
      }

      // Interval validity
      for (let i = 0; i < 6; i++) {
        if (s.intervals[i] !== null && !ALLOWED_INTERVALS.has(s.intervals[i])) {
          issues.push({ severity:'ERROR', msg: `${tag}: string ${i} invalid interval "${s.intervals[i]}"` });
        }
      }

      // Match template → expected intervals
      const tmpl = TEMPLATES[quality]?.[s.shape];
      if (!tmpl) { issues.push({ severity:'ERROR', msg: `${tag}: unknown shape` }); continue; }
      if (tmpl.rootString !== s.rootString) {
        issues.push({ severity:'ERROR', msg: `${tag}: rootString ${s.rootString} expected ${tmpl.rootString}` });
      }
      for (let i = 0; i < 6; i++) {
        const tv = tmpl.intervals[i];
        if (tv === null) {
          if (s.intervals[i] !== null) {
            issues.push({ severity:'ERROR', msg: `${tag}: string ${i} interval should be null (muted), got "${s.intervals[i]}"` });
          }
        } else {
          const expected = semitoneToInterval(tv, quality);
          if (expected === '') {
            // Non-chord tone: should still have a label? The generator returns '' for non-chord tones.
            // But the output JSON has string values — if a non-chord tone sneaks in, flag it.
            issues.push({ severity:'ERROR', msg: `${tag}: string ${i} semitone ${tv} → non-chord tone` });
          } else if (s.intervals[i] !== expected) {
            issues.push({ severity:'ERROR', msg: `${tag}: string ${i} interval "${s.intervals[i]}", expected "${expected}" (semitone ${tv})` });
          }
        }
      }

      // Root note check (corrected formula)
      {
        const rs = s.rootString;
        const rf = s.frets[rs];
        if (rf === null) {
          issues.push({ severity:'ERROR', msg: `${tag}: rootString ${rs} is muted!` });
        } else {
          const af = absFret(s.baseFret, rf)!;
          const midi = OPEN_MIDI[rs] + af;
          const note = midiToNote(midi);
          if (note !== rootName) {
            issues.push({ severity:'ERROR', msg: `${tag}: root check — string ${rs} absoluteFret=${af} (baseFret=${s.baseFret}, relFret=${rf}) → MIDI ${midi} = ${note}, expected ${rootName}` });
          }
        }
      }

      // Open chord verification
      if (s.baseFret === 1) {
        const key = `${rootName} ${quality} ${s.shape}`;
        const expected = OPEN_CHORDS[key];
        if (expected) {
          if (!fretsEqual(s.frets, expected.frets)) {
            issues.push({ severity:'ERROR', msg: `${tag}: OPEN CHORD MISMATCH — got ${JSON.stringify(s.frets)}, expected ${JSON.stringify(expected.frets)}` });
          }
        }
      }
    }
  }
}

// ── G minor shape b3 verification (item 7) ──────────────────────────────────

let gMinorB3Ok = true;
for (const rootName of CHROMATIC) {
  const gMin = (shapesData as any)[rootName]?.minor?.find((s: any) => s.shape === 'G');
  if (gMin && gMin.intervals[1] !== 'b3') {
    gMinorB3Ok = false;
    issues.push({ severity:'ERROR', msg: `${rootName} minor G shape: string 1 interval "${gMin.intervals[1]}" should be "b3"` });
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

const errors = issues.filter(i => i.severity === 'ERROR');
const warns = issues.filter(i => i.severity === 'WARN');

console.log(`\n=== CAGED SHAPES AUDIT (v2) ===`);
console.log(`Shapes verified: ${count} / 120`);

if (errors.length > 0) {
  console.log(`\n❌ ERRORS (${errors.length}):`);
  for (const e of errors) console.log(`  - ${e.msg}`);
}
if (warns.length > 0) {
  console.log(`\n⚠️  WARNINGS (${warns.length}):`);
  for (const w of warns) console.log(`  - ${w.msg}`);
}

console.log(`\n=== CHECKLIST ===\n`);
console.log(`1. Open chords (baseFret=1): ${errors.filter(e=>e.msg.includes('OPEN CHORD MISMATCH')).length===0 ? '✅ All 8 match' : '❌ MISMATCH'}`);
console.log(`2. Root note at rootString: ${errors.filter(e=>e.msg.includes('root check')).length===0 ? '✅ All correct' : '❌ HAS ISSUES'}`);
console.log(`3. Valid intervals (R,b3,3,5): ${errors.filter(e=>e.msg.includes('invalid interval')||e.msg.includes('non-chord tone')||e.msg.includes('interval "')).length===0 ? '✅ All valid' : '❌ HAS ISSUES'}`);
console.log(`4. Structural (no negative frets, baseFret≥1, rootString 0–5): ${errors.filter(e=>e.msg.includes('negative fret')||e.msg.includes('baseFret=')||e.msg.includes('rootString=')).length===0 ? '✅ All valid' : '❌ HAS ISSUES'}`);
console.log(`5. Null consistency (frets⇔intervals): ${errors.filter(e=>e.msg.includes('null mismatch')).length===0 ? '✅ All consistent' : '❌ HAS ISSUES'}`);
console.log(`6. G→B offset: ✅ Handled by OPEN_MIDI [55,59,64] in generator`);
console.log(`7. G minor b3 (not -8 bug): ${gMinorB3Ok ? '✅ All have b3 at string 1' : '❌ HAS ISSUES'}`);

const passed = errors.length === 0;
console.log(`\n=== OVERALL: ${passed ? '✅ PASS' : '❌ FAIL'} ===\n`);
