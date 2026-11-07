import { PROGRAM_ID } from './fortis-program.js';

const circuits = {
  push: [
    ['row', 'Light cable row', '12–15 reps'],
    ['pressdown', 'Light rope pressdown', '12–15 reps'],
    ['scapular-pushup', 'Scapular push-up', '8–10 reps'],
  ],
  pull: [
    ['row', 'Light cable row', '12–15 reps'],
    ['straight-arm', 'Light straight-arm pulldown', '12–15 reps'],
    ['pull-apart', 'Band pull-apart', '12–15 reps'],
  ],
  'legs-a': [
    ['legcurl', 'Light kneeling leg curl', '10–12 reps / side'],
    ['squat', 'Bodyweight squat', '8–10 reps'],
    ['deadbug', 'Dead bug', '4 reps / side'],
  ],
  'legs-b': [
    ['legcurl', 'Light kneeling leg curl', '10–12 reps / side'],
    ['bridge', 'Unloaded glute bridge', '10 reps'],
    ['birddog', 'Bird dog', '4 reps / side'],
  ],
};

export function warmupSteps(session) {
  const family = session.code.startsWith('push') ? 'push' : session.code.startsWith('pull') ? 'pull' : session.code;
  const circuit = circuits[family]?.map(item => item[0]==='legcurl' && session.exercises.some(e=>e.id.endsWith('-seated-legcurl'))
    ? ['seated-legcurl','Light seated leg curl','10–12 reps'] : item);
  if (!circuit) return [];
  const round = (number, optional = false) => circuit.map(([id, name, target]) => ({
    id: `circuit-${number}-${id}`, name, target, optional, phase: number === 1 ? 'circuit' : 'repeat',
    cue: `${target.includes('/ side') ? 'Complete both sides before checking. ' : ''}Very easy: about 8+ reps in reserve, effort 3–4/10.`,
  }));
  const first = session.exercises[0];
  const pullup = first.kind === 'pullup';
  const deadlift = session.code === 'legs-b';
  const ramps = pullup
    ? [['5 reps', 'Use enough assistance for easy, controlled reps.'], ['3 reps', 'Reduce assistance only as appropriate; keep this easy.'], ['1–2 reps', 'Optional final rehearsal near the chosen work load, without fatigue.']]
    : [[deadlift ? '5 reps' : '8–10 reps', deadlift ? 'Very light load at normal floor height; use full-diameter light plates or a suitable setup.' : first.isMain ? 'Empty bar or a very light load; rehearse today’s exact setup.' : 'Very light stack setting; rehearse controlled full reps.'],
      ['5 reps', 'Increase gradually toward the work load; stay comfortably short of failure.'],
      ['3 reps', 'A little closer to the work load; keep every rep smooth.'],
      ['1–2 reps', 'Optional final rehearsal if another load step is useful; no grinding.']];
  return [
    ...round(1),
    ...(!session.light && ['push', 'pull'].includes(family) ? round(2, true) : []),
    ...ramps.map(([target, cue], i) => ({
      id: `ramp-${first.id}-${i + 1}`, name: `${first.name} · ramp ${i + 1}`, target,
      phase: 'ramp', optional: i === ramps.length - 1,
      cue: `${cue}${first.variation === 'paused-bench' ? ' Hold the chest pause for one second.' : first.variation === 'paused-deadlift' ? ' Practise the one-second pause just off the floor.' : first.variation === 'ssb-box-squat' ? ' Use the actual SSB and stable box; stay braced on contact.' : ''}`,
    })),
  ];
}

export const warmupKey = (session, step) => `${PROGRAM_ID}:warmup:${session.week}:${session.code}:${step.id}`;

export function warmupCounts(session, getRecord) {
  let total = 0, done = 0, extra = 0, saved = false;
  for (const step of warmupSteps(session)) {
    const record = getRecord(warmupKey(session, step));
    if (record) saved = true;
    if (!step.optional) { total++; if (record?.done === true) done++; }
    else if (record?.done === true) extra++;
  }
  return {total, done, extra, saved};
}
