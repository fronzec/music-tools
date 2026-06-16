<script lang="ts">
  import type { NoteName, ViewName } from '$lib/types/chord';
  import { CHROMATIC, STANDARD_TUNING } from '$lib/types/chord';
  import { semitoneToNoteName } from '$lib/theory/notes';
  import { stringY, fretLineX, noteX, viewBoxW, viewBoxH, FRET_MARKERS, L } from '$lib/theory/layout';

  interface Props {
    navigate: (view: ViewName) => void;
  }

  let { navigate }: Props = $props();

  let mode = $state<'explore' | 'quiz'>('explore');
  let selectedNote = $state<NoteName | null>(null);
  let showOctaves = $state(true);
  let showUnisons = $state(true);
  let difficulty = $state<'easy' | 'medium' | 'hard'>('medium');
  let correct = $state(0);
  let total = $state(0);
  let streak = $state(0);
  let bestStreak = $state(0);
  let currentQuestion = $state<{
    string: number;
    fret: number;
    correct: NoteName;
    options: NoteName[];
  } | null>(null);
  let lastAnswer = $state<'correct' | 'incorrect' | null>(null);

  const strings = [0, 1, 2, 3, 4, 5];
  const frets = Array.from({ length: 13 }, (_, i) => i); // 0..12
  const vbW = $derived(viewBoxW(13));
  const vbH = $derived(viewBoxH());

  function noteAt(s: number, f: number): NoteName {
    return semitoneToNoteName((STANDARD_TUNING[s] + f) % 12);
  }

  function labelX(f: number): number {
    if (f === 0) return L.LEFT_PAD + L.NUT_W + 4;
    return noteX(f, 0);
  }

  function isMatch(s: number, f: number): boolean {
    if (!selectedNote) return false;
    return noteAt(s, f) === selectedNote;
  }

  function getOctaveLines(): Array<{ x1: number; y1: number; x2: number; y2: number }> {
    if (!selectedNote) return [];
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let s = 0; s < 4; s++) {
      for (let f = 0; f <= 12; f++) {
        if (!isMatch(s, f)) continue;
        const offset = s === 2 ? 3 : 2;
        const f2 = f + offset;
        if (f2 <= 12 && isMatch(s + 2, f2)) {
          lines.push({
            x1: labelX(f),
            y1: stringY(s),
            x2: labelX(f2),
            y2: stringY(s + 2),
          });
        }
      }
    }
    return lines;
  }

  function getUnisonLines(): Array<{ x1: number; y1: number; x2: number; y2: number }> {
    if (!selectedNote) return [];
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    // Iterate from thinner string (s+1) at fret f; same note on thicker string (s) is at f+offset
    // Standard tuning: adjacent strings differ by 5 semitones (G→B by 4)
    for (let s = 0; s < 5; s++) {
      const offset = s === 3 ? 4 : 5; // G→B interval is 4 semitones, all others 5
      for (let f = 0; f <= 12; f++) {
        if (!isMatch(s + 1, f)) continue; // note on thinner string at fret f
        const f2 = f + offset;            // same note on thicker string at fret f+offset
        if (f2 > 12) continue;
        if (!isMatch(s, f2)) continue;
        lines.push({
          x1: labelX(f),
          y1: stringY(s + 1),
          x2: labelX(f2),
          y2: stringY(s),
        });
      }
    }
    return lines;
  }

  function toggleNote(note: NoteName) {
    selectedNote = selectedNote === note ? null : note;
  }

  function generateQuestion() {
    const maxFret = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 9 : 12;
    const s = Math.floor(Math.random() * 6);
    const f = Math.floor(Math.random() * (maxFret + 1));
    const correctAnswer = noteAt(s, f);
    const options = [correctAnswer];
    while (options.length < 4) {
      const d = CHROMATIC[Math.floor(Math.random() * 12)];
      if (!options.includes(d)) options.push(d);
    }
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j]!, options[i]!];
    }
    currentQuestion = { string: s, fret: f, correct: correctAnswer, options };
    lastAnswer = null;
  }

  function answer(note: NoteName) {
    if (!currentQuestion || lastAnswer === 'correct') return;
    total++;
    if (note === currentQuestion.correct) {
      correct++;
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      lastAnswer = 'correct';
      setTimeout(() => generateQuestion(), 1500);
    } else {
      streak = 0;
      lastAnswer = 'incorrect';
    }
  }

  $effect(() => {
    if (mode === 'quiz') {
      currentQuestion = null;
      generateQuestion();
    }
  });

  function isQuizHighlight(s: number, f: number): boolean {
    if (mode !== 'quiz' || !currentQuestion) return false;
    return s === currentQuestion.string && f === currentQuestion.fret;
  }
</script>

<div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
  <button
    class="mb-6 text-sm font-medium text-muted transition-colors duration-200 hover:text-accent-soft"
    aria-label="Back to Home"
    onclick={() => navigate('home')}
  >
    ← Back to Home
  </button>

  <h1 class="mb-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Note Trainer</h1>

  <!-- Mode tabs -->
  <div class="mb-6 inline-flex rounded-lg border border-hairline bg-surface p-0.5" role="tablist">
    <button
      class="rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200"
      class:bg-surface-raised={mode === 'explore'}
      class:text-ink={mode === 'explore'}
      class:shadow-sm={mode === 'explore'}
      class:text-muted={mode !== 'explore'}
      class:hover:text-ink={mode !== 'explore'}
      role="tab"
      aria-selected={mode === 'explore'}
      onclick={() => (mode = 'explore')}
    >Explore</button>
    <button
      class="rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200"
      class:bg-surface-raised={mode === 'quiz'}
      class:text-ink={mode === 'quiz'}
      class:shadow-sm={mode === 'quiz'}
      class:text-muted={mode !== 'quiz'}
      class:hover:text-ink={mode !== 'quiz'}
      role="tab"
      aria-selected={mode === 'quiz'}
      onclick={() => (mode = 'quiz')}
    >Quiz</button>
  </div>

  <!-- Note filter bar -->
  <div class="mb-6 rounded-xl border border-hairline bg-surface-raised p-4">
    <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Notes</div>
    <div class="flex flex-wrap gap-1.5" role="group" aria-label="Select note to highlight">
      {#each CHROMATIC as note (note)}
        {#if mode === 'explore' || (currentQuestion && currentQuestion.options.includes(note))}
          <button
            aria-label={mode === 'explore' ? `Select ${note}` : `Answer ${note}`}
            aria-pressed={selectedNote === note}
            class={[
              'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 border',
              lastAnswer === 'correct' && currentQuestion?.correct === note
                ? 'bg-success/20 text-success border-success/50'
                : lastAnswer === 'incorrect' && currentQuestion?.correct === note
                  ? 'bg-error/20 text-error border-error/50'
                  : selectedNote === note
                    ? 'bg-accent/15 text-accent-soft border-accent/50'
                    : 'bg-surface text-muted border-transparent hover:border-accent/40',
            ].join(' ')}
            onclick={() => (mode === 'explore' ? toggleNote(note) : answer(note))}
          >
            {note}
          </button>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Explore mode toggles -->
  {#if mode === 'explore'}
    <div class="mb-6 flex flex-wrap gap-3">
      <label class="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface text-muted px-3 py-1.5 text-sm cursor-pointer hover:text-ink hover:border-accent/40">
        <input type="checkbox" bind:checked={showOctaves} class="rounded" />
        Octaves
      </label>
      <label class="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface text-muted px-3 py-1.5 text-sm cursor-pointer hover:text-ink hover:border-accent/40">
        <input type="checkbox" bind:checked={showUnisons} class="rounded" />
        Unisons
      </label>
    </div>
  {/if}

  <!-- Quiz mode controls -->
  {#if mode === 'quiz'}
    <div class="mb-6 space-y-4">
      <div class="rounded-xl border border-hairline bg-surface-raised p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Difficulty</div>
        <div class="inline-flex rounded-lg border border-hairline bg-surface p-0.5" role="radiogroup" aria-label="Difficulty">
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-surface-raised={difficulty === 'easy'}
            class:text-ink={difficulty === 'easy'}
            class:shadow-sm={difficulty === 'easy'}
            class:text-muted={difficulty !== 'easy'}
            class:hover:text-ink={difficulty !== 'easy'}
            role="radio" aria-checked={difficulty === 'easy'}
            onclick={() => { difficulty = 'easy'; generateQuestion(); }}
          >Easy</button>
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-surface-raised={difficulty === 'medium'}
            class:text-ink={difficulty === 'medium'}
            class:shadow-sm={difficulty === 'medium'}
            class:text-muted={difficulty !== 'medium'}
            class:hover:text-ink={difficulty !== 'medium'}
            role="radio" aria-checked={difficulty === 'medium'}
            onclick={() => { difficulty = 'medium'; generateQuestion(); }}
          >Medium</button>
          <button
            class="rounded-md px-3 py-1 text-sm font-medium transition-all duration-200"
            class:bg-surface-raised={difficulty === 'hard'}
            class:text-ink={difficulty === 'hard'}
            class:shadow-sm={difficulty === 'hard'}
            class:text-muted={difficulty !== 'hard'}
            class:hover:text-ink={difficulty !== 'hard'}
            role="radio" aria-checked={difficulty === 'hard'}
            onclick={() => { difficulty = 'hard'; generateQuestion(); }}
          >Hard</button>
        </div>
      </div>

      <div class="rounded-xl border border-hairline bg-surface-raised p-4">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Score</div>
        <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink">
          <span>{correct}/{total} correct</span>
          <span>Streak: {streak}</span>
          <span>Best: {bestStreak}</span>
        </div>
      </div>

      {#if lastAnswer === 'incorrect' && currentQuestion}
        <div class="rounded-xl border border-error/50 bg-error/10 p-4">
          <p class="text-sm text-error">
            The correct answer was <strong>{currentQuestion.correct}</strong> — <button
              class="ml-2 text-accent-soft underline hover:text-accent text-sm font-medium"
              onclick={generateQuestion}
            >Try another</button>
          </p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- SVG Fretboard -->
  <div class="rounded-xl border border-hairline bg-surface-raised overflow-x-auto">
    <svg viewBox="0 0 {vbW} {vbH}" xmlns="http://www.w3.org/2000/svg" class="w-full min-w-[600px] h-auto" role="img" aria-label="Fretboard">
      <title>Note Trainer Fretboard</title>

      <!-- Fret lines -->
      {#each frets as f (f)}
        {@const fx = fretLineX(f)}
        <line x1={fx} y1={stringY(0)} x2={fx} y2={stringY(5)} class="stroke-hairline" stroke-width="1" />
      {/each}

      <!-- Nut (thick) -->
      <line x1={L.LEFT_PAD} y1={stringY(0)} x2={L.LEFT_PAD} y2={stringY(5)} class="stroke-muted" stroke-width="4" />

      <!-- Marker fret backgrounds (before strings) -->
      {#each FRET_MARKERS.filter((m) => m <= 12) as mf (mf)}
        <rect x={fretLineX(mf - 1)} y={stringY(5)} width={L.FRET_SP} height={stringY(0) - stringY(5)} class="fret-marker-bg fill-hairline" />
      {/each}

      <!-- String lines -->
      {#each strings as i (i)}
        <line x1={L.LEFT_PAD} y1={stringY(i)} x2={fretLineX(12)} y2={stringY(i)} class="stroke-hairline" stroke-width="1" />
      {/each}

      <!-- Fret markers (dots) -->
      {#each FRET_MARKERS.filter((m) => m <= 12) as mf (mf)}
        {@const mx = noteX(mf, 0)}
        <circle cx={mx} cy={stringY(2.5)} r={L.MARKER_R} class="fill-muted" />
        {#if mf === 12}
          <circle cx={mx} cy={stringY(1.5)} r={L.MARKER_R} class="fill-muted" />
          <circle cx={mx} cy={stringY(3.5)} r={L.MARKER_R} class="fill-muted" />
        {/if}
      {/each}

      <!-- String name labels (hidden in quiz medium/hard — tuning is part of what you must know) -->
      {#if mode !== 'quiz' || difficulty === 'easy'}
      {#each strings as s (s)}
        <text
          x={L.LEFT_PAD - 8}
          y={stringY(s)}
          dy="3"
          text-anchor="middle"
          font-size="8"
          class="fill-muted select-none pointer-events-none"
        >{(['E','A','D','G','B','e'])[s]}</text>
      {/each}
      {/if}

      <!-- Fret number labels -->
      {#each frets.slice(1) as f (f)}
        <text
          x={labelX(f)}
          y={stringY(0) + 14}
          text-anchor="middle"
          font-size="7"
          class="fill-muted select-none pointer-events-none"
        >{f}</text>
      {/each}

      <!-- Highlight rectangles for matching notes -->
      {#each strings as s (s)}
        {#each frets as f (f)}
          {#if isMatch(s, f)}
            {@const cx = labelX(f)}
            {@const cy = stringY(s)}
            <rect x={cx - 13} y={cy - 9} width="26" height="18" rx="3" class="fill-note-root/25" />
          {/if}
        {/each}
      {/each}

      <!-- Quiz position highlight -->
      {#each strings as s (s)}
        {#each frets as f (f)}
          {#if isQuizHighlight(s, f)}
            {@const cx = labelX(f)}
            {@const cy = stringY(s)}
            <circle cx={cx} cy={cy} r="14" fill="none" stroke-width="2.5" class="quiz-pulse"
              class:stroke-success={lastAnswer === 'correct'}
              class:stroke-error={lastAnswer === 'incorrect'}
              class:stroke-accent={lastAnswer === null}
            />
            <circle cx={cx} cy={cy} r="14"
              class={lastAnswer === 'correct' ? 'fill-success/30' : lastAnswer === 'incorrect' ? 'fill-error/30' : 'fill-accent/30'}
            />
          {/if}
        {/each}
      {/each}

      <!-- Octave lines -->
      {#if mode === 'explore' && showOctaves}
        {#each getOctaveLines() as line (line.x1 + '-' + line.y1 + '-' + line.x2 + '-' + line.y2)}
          <line
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            class="stroke-accent" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"
          />
        {/each}
      {/if}

      <!-- Unison lines -->
      {#if mode === 'explore' && showUnisons && selectedNote}
        {#each getUnisonLines() as line (`${line.x1}-${line.y1}-${line.x2}-${line.y2}`)}
          <line
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            class="stroke-success" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.65"
          />
        {/each}
      {/if}

      <!-- Note labels -->
      {#each strings as s (s)}
        {#each frets as f (f)}
          {@const cx = labelX(f)}
          {@const cy = stringY(s)}
          {@const note = noteAt(s, f)}
          {@const isReveal = mode === 'quiz' && lastAnswer !== null && isQuizHighlight(s, f)}
          {@const matched = isMatch(s, f) || isReveal}
          {#if mode !== 'quiz' || isReveal}
            <text
              x={cx}
              y={cy}
              dy="3"
              text-anchor="middle"
              font-size={matched ? '8' : '7'}
              font-weight={matched ? 'bold' : 'normal'}
              class="select-none pointer-events-none"
              class:fill-note-root={matched}
              class:fill-ink={!matched}
            >{note}</text>
          {/if}
        {/each}
      {/each}
    </svg>
  </div>
</div>

<style>
  @keyframes quizPulse {
    0%, 100% { r: 14; }
    50% { r: 17; }
  }
  .quiz-pulse {
    animation: quizPulse 1.2s ease-in-out infinite;
  }
</style>
