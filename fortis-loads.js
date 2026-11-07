import { PROGRAM_ID } from './fortis-program.js';

// Trial settings only: these are never prescriptions, performed records or a
// conversion between different machines. Actual performance takes precedence.
const estimate = (value, basis, label = null) => ({value,
  label: label ?? `Estimated trial: ${value} lb — calibrate during ramps`, basis});
const accessoryEstimates = {
  incline: [55, 'Conservative estimate below the archived 65 lb-per-hand prescription; not verified performance.'],
  lateral: [7.5, 'Low-confidence cable-stack trial setting; stack ratios and increments differ.'],
  pressdown: [30, 'Conservative trial below the archived 40 lb stack prescription; verify this station.'],
  pullup: [0, 'Trial at bodyweight, not evidence that unassisted reps are achievable; use assistance as needed.'],
  belt: [70, 'Conservative plates-added trial below the archived 90 lb belt-squat prescription.'],
  legcurl: [20, 'Conservative trial below the archived 25 lb kneeling-curl prescription, per side.'],
  shoulder: [35, 'Conservative per-hand trial below the archived 45 lb shoulder-press prescription.'],
  triceps: [20, 'Low-confidence cable-stack trial below the archived 30 lb overhead-triceps prescription.'],
  pallof: [15, 'Low-confidence stack trial below the archived 20 lb Pallof prescription, per side.'],
  abwheel: [0, 'Bodyweight with a controlled, comfortable reach; progress reps and reach rather than external load.'],
  fly: [10, 'Very low-confidence generic trial per cable stack; no verified prior load for this exercise.'],
  curl: [20, 'Very low-confidence generic cable-stack trial; not converted from archived dumbbell curls.'],
  hammer: [20, 'Very low-confidence generic rope-curl stack trial; not converted from dumbbell hammer curls.'],
  pulldown: [60, 'Very low-confidence generic cable-stack trial; not converted from pull-up performance.'],
  crunch: [20, 'Very low-confidence generic cable-stack trial for a new exercise; no verified prior load.'],
};
const mainEstimates = {
  bench: [185, 'Archived week-one bench back-off prescription, used only as a conservative estimate; not a performed lift.'],
  'paused-bench': [155, 'Very low-confidence conservative coaching estimate for paused bench; no validated ratio to regular bench.'],
  'back-squat': [245, 'Archived week-one squat back-off prescription, used only as a conservative estimate; not a performed lift.'],
  'ssb-box-squat': [185, 'Very low-confidence coaching estimate for an unfamiliar variation. Include the actual SSB bar weight; no conversion ratio is assumed.'],
  'conventional-deadlift': [275, 'Archived week-one deadlift back-off prescription, used only as a conservative estimate; not a performed lift.'],
  'paused-deadlift': [225, 'Very low-confidence conservative coaching estimate for paused deadlift; no validated ratio to conventional deadlift.'],
};
export function estimateFor(exercise, {light = false} = {}) {
  if (light) return {value: exercise.unit === 'bodyweight' ? 0 : null,
    label: 'Choose an easy load / range for 4+ RIR; do not apply the normal estimate',
    basis: 'Lighter weeks use fewer sets and easier actual effort. A stack setting is not a universal percentage of resistance.'};
  if (exercise.variation && mainEstimates[exercise.variation]) return estimate(...mainEstimates[exercise.variation]);
  const suffix = exercise.id.split('-').at(-1);
  if (suffix === 'row') return estimate(null,
    'Very low-confidence station-dependent trial options; select the actual station and record its loading convention.',
    'Trial: 40 lb stack or 45 lb added plates; choose station and calibrate');
  if (suffix === 'rear') return estimate(null,
    'Cable stacks and rear-delt machines are different exercises with different resistance; these are trial options, not equivalent loads.',
    'Trial: 5 lb per cable stack or 20 lb on machine; calibrate');
  if (suffix === 'legextension') return estimate(null,
    'Equipment is unconfirmed. After confirming the machine, calibrate its own marked loading convention; no conversion from leg press is assumed.',
    'Manual calibration: confirm the leg-extension machine and choose a light trial setting');
  if (suffix === 'legpress') return estimate(null,
    'Carriage mass, angle and marked load conventions differ. No squat-to-leg-press conversion is assumed.',
    'Trial: empty carriage, then small plates; record marked loading convention');
  if (suffix === 'calf') return /seated/i.test(exercise.name)
    ? estimate(35, 'Conservative plates-added trial below the archived 45 lb seated-calf prescription.')
    : estimate(25, 'Conservative per-hand trial below the archived 30 lb standing-calf dumbbell prescription.');
  const starter = accessoryEstimates[suffix];
  if (starter) {
    const result = estimate(...starter);
    if (exercise.unit === 'bodyweight') result.label = 'Bodyweight — choose a controlled reach';
    else if (exercise.kind === 'pullup') result.label = 'Trial: bodyweight (0 lb added); use assistance if needed';
    return result;
  }
  return {value: null, label: 'Choose a light trial load and calibrate',
    basis: 'No exercise-specific estimate is available. This is not a performed load.'};
}

const finiteNumber = n => typeof n === 'number' && Number.isFinite(n);
const positiveInteger = n => Number.isInteger(n) && n > 0;
const result = (kind, text, load = null, week = null) => ({kind, text, load, week});

export function progressionFor({program, session, exercise, getRecord}) {
  const position = program.findIndex(s => s === session || (s.week === session.week && s.code === session.code));
  let previous = null;
  // A partial recent exposure supersedes an older successful one. Do not scan
  // backwards until a convenient qualifying performance is found.
  for (let i = position - 1; i >= 0; i--) {
    const candidate = program[i];
    if (candidate.light || candidate.code !== session.code) continue;
    const oldExercise = candidate.exercises.find(e => e.id === exercise.id);
    if (!oldExercise) continue;
    const records = oldExercise.sets.map((_, setIndex) => getRecord(
      `${PROGRAM_ID}:${candidate.week}:${candidate.code}:${oldExercise.id}:${setIndex}`));
    if (records.some(r => r !== null && r !== undefined)) {
      previous = {session: candidate, exercise: oldExercise, records};
      break;
    }
  }
  if (session.light) {
    let normalLoad = null;
    if (previous) {
      const loads = previous.records.filter(r => r?.done === true).map(r => exercise.unit === 'bodyweight' ? 0 : r.weight);
      if (loads.length && loads.every(n => finiteNumber(n) && (n >= 0 || exercise.kind === 'pullup')) && new Set(loads).size === 1) normalLoad = loads[0];
    }
    return result('light', normalLoad === null
      ? 'Lighter week: choose an easy load / range at 4+ RIR. Calibrate manually; do not earn a progression increase.'
      : `Lighter week: last normal recorded load was ${normalLoad} lb. Choose an easier load / range at 4+ RIR; do not automatically copy it or earn an increase.`,
    normalLoad, previous?.session.week ?? null);
  }
  if (!previous) return result('calibrate', 'No earlier normal actual sets for this exact variation. Calibrate from ramps; estimates are trial settings, not progression.');
  const {records, exercise: oldExercise} = previous;
  const priorWeek = previous.session.week;
  const incomplete = text => result('incomplete', `Week ${priorWeek}: ${text} No load increase is suggested.`, null, priorWeek);
  if (records.some(r => !r || r.done !== true)) return incomplete('the latest recorded normal exposure has missing or unfinished sets.');
  if (records.some(r => !finiteNumber(r.rir) || r.rir < 0 || r.rir > 10)) return incomplete('record actual RIR for every set; blank or invalid RIR cannot establish progression.');
  const repFields = exercise.unilateral ? ['left', 'right'] : ['reps'];
  if (records.some(r => repFields.some(field => !positiveInteger(r[field])))) return incomplete('record valid actual reps for every set and both sides of unilateral work.');
  const loads = records.map(r => exercise.unit === 'bodyweight' ? 0 : r.weight);
  if (loads.some(n => !finiteNumber(n) || (n < 0 && exercise.kind !== 'pullup'))) return incomplete('record valid actual load for every set.');
  if (new Set(loads).size !== 1) return incomplete('the work sets used different loads; review them manually before progressing.');
  const load = loads[0];
  const minRirs = oldExercise.sets.map(s => Number.parseFloat(s.rir));
  if (minRirs.some(n => !Number.isFinite(n))) return incomplete('the previous effort target is unavailable.');
  if (records.some((r, i) => r.rir < minRirs[i] || repFields.some(field => r[field] < oldExercise.repMin))) {
    return result('hold', `Week ${priorWeek}: reps or effort missed the target. Hold or reduce the load; repeat the last successful load and reps without grinding.`, load, priorWeek);
  }
  if (!records.every(r => repFields.every(field => r[field] >= oldExercise.repMax))) {
    return result('hold', `Week ${priorWeek}: keep ${load} lb and aim for one more clean total rep within ${exercise.repMin}–${exercise.repMax}, keeping the prescribed RIR.`, load, priorWeek);
  }
  const action = exercise.unit === 'bodyweight'
    ? 'Progress controlled reach slightly only while maintaining position; do not add weight automatically.'
    : exercise.kind === 'pullup' && load < 0
      ? `Reduce assistance by the smallest available step, then return to ${exercise.repMin} reps. Reduce assistance before adding external weight.`
      : `Consider the smallest available load increase, then return to ${exercise.repMin} reps. Check the actual equipment increment; no numeric increase is assumed.`;
  return result('increase', `Week ${priorWeek}: every set reached the rep ceiling at the intended RIR. ${action}`, load, priorWeek);
}
