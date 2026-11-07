import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM, PROGRAM_ID, buildProgram } from '../fortis-program.js';
import { estimateFor, progressionFor } from '../fortis-loads.js';

const key = (s, e, i) => `${PROGRAM_ID}:${s.week}:${s.code}:${e.id}:${i}`;
function fixture(code = 'push-a', suffix = null, program = PROGRAM) {
  const sessions = program.filter(s => s.code === code && !s.light);
  const [oldSession, previousSession, currentSession] = sessions;
  const exercise = currentSession.exercises.find(e => suffix ? e.id.endsWith(suffix) : e.isMain) || currentSession.exercises[0];
  const records = new Map();
  function fill(s, patch = {}) {
    const prior = s.exercises.find(e => e.id === exercise.id);
    prior.sets.forEach((_, i) => records.set(key(s, prior, i), {
      done: true, weight: 100, rir: 2,
      ...(prior.unilateral ? {left: prior.repMax, right: prior.repMax} : {reps: prior.repMax}),
      ...patch,
    }));
  }
  const evaluate = session => progressionFor({program, session: session || currentSession,
    exercise, getRecord: id => records.get(id)});
  return {oldSession, previousSession, currentSession, exercise, records, fill, evaluate};
}

test('every active exercise has an explicit estimate or station-specific trial explanation', () => {
  const before = JSON.stringify(PROGRAM);
  for (const s of PROGRAM) for (const e of s.exercises) {
    const hint = estimateFor(e);
    assert(hint.label && hint.basis);
    assert.doesNotMatch(hint.basis, /No exercise-specific estimate/);
    assert(hint.value === null || Number.isFinite(hint.value));
    if (/row|rear|legpress$/.test(e.id)) assert.equal(hint.value, null, `${e.id} must not collapse station alternatives into one applicable number`);
    if (e.unit === 'bodyweight') assert.equal(hint.value, 0);
    const lightHint = estimateFor(e, {light: true});
    assert.equal(lightHint.value, e.unit === 'bodyweight' ? 0 : null);
    assert.match(lightHint.label, /4\+ RIR/);
  }
  assert.equal(JSON.stringify(PROGRAM), before, 'estimates never rewrite prescribed weights or actual records');
});

test('main estimates distinguish regular, paused and SSB variations without future-week increases', () => {
  const expected = {bench: 185, 'paused-bench': 155, 'back-squat': 245,
    'ssb-box-squat': 185, 'conventional-deadlift': 275, 'paused-deadlift': 225};
  const found = new Set();
  const withVariants = buildProgram({'5:legs-a': {variation: 'ssb-box-squat'}, '5:legs-b': {variation: 'paused-deadlift'}});
  for (const s of [...PROGRAM, ...withVariants]) for (const e of s.exercises.filter(e => e.isMain)) {
    assert.equal(estimateFor(e).value, expected[e.variation]);
    found.add(e.variation);
  }
  assert.equal(found.size, Object.keys(expected).length);
});

test('no actual history means calibration, not progression from an estimated target', () => {
  const f = fixture();
  assert.deepEqual(f.evaluate(), {kind: 'calibrate', load: null, week: null,
    text: 'No earlier normal actual sets for this exact variation. Calibrate from ramps; estimates are trial settings, not progression.'});
});

test('complete rep-ceiling performance suggests a conditional step without calculating or applying weight', () => {
  const f = fixture();
  f.fill(f.previousSession, {weight: 185});
  const before = JSON.stringify([...f.records]);
  const advice = f.evaluate();
  assert.equal(advice.kind, 'increase');
  assert.equal(advice.load, 185, 'load is the observed baseline, not an automatically increased target');
  assert.equal(advice.week, f.previousSession.week);
  assert.match(advice.text, /smallest available/);
  assert.match(advice.text, /return to 4 reps/);
  assert.equal(JSON.stringify([...f.records]), before);
});

test('latest partial exposure blocks an increase earned by an older completed exposure', () => {
  const f = fixture();
  f.fill(f.oldSession);
  const oldEx = f.previousSession.exercises.find(e => e.id === f.exercise.id);
  f.records.set(key(f.previousSession, oldEx, 0), {done: true, weight: 100, reps: oldEx.repMax, rir: 2});
  const advice = f.evaluate();
  assert.equal(advice.kind, 'incomplete');
  assert.equal(advice.week, f.previousSession.week);
  assert.match(advice.text, /missing or unfinished/);
});

test('missing actual fields, unchecked sets, invalid reps and mixed loads cannot qualify', () => {
  for (const patch of [{rir: null}, {rir: ''}, {rir: '2'}, {rir: 11}, {reps: 0}, {reps: 4.5}, {weight: null}, {weight: -5}, {done: false}]) {
    const f = fixture();
    f.fill(f.previousSession, patch);
    assert.equal(f.evaluate().kind, 'incomplete', JSON.stringify(patch));
  }
  const missingRir = fixture();
  missingRir.fill(missingRir.previousSession, {rir: undefined});
  assert.match(missingRir.evaluate().text, /actual RIR/);
  const mixed = fixture();
  mixed.fill(mixed.previousSession);
  const firstKey = key(mixed.previousSession, mixed.exercise, 0);
  mixed.records.set(firstKey, {...mixed.records.get(firstKey), weight: 105});
  assert.equal(mixed.evaluate().kind, 'incomplete');
  assert.match(mixed.evaluate().text, /different loads/);
});

test('below-target effort and reps hold or reduce; incomplete rep-range progression retains load', () => {
  for (const patch of [{rir: 1}, {reps: 3}]) {
    const f = fixture();
    f.fill(f.previousSession, patch);
    assert.equal(f.evaluate().kind, 'hold');
    assert.match(f.evaluate().text, /Hold or reduce/);
  }
  const f = fixture();
  f.fill(f.previousSession, {reps: 5});
  const advice = f.evaluate();
  assert.equal(advice.kind, 'hold');
  assert.equal(advice.load, 100);
  assert.match(advice.text, /one more clean total rep/);
});

test('both sides of unilateral work must reach the ceiling at the required effort', () => {
  const f = fixture('legs-b', 'pallof');
  f.fill(f.previousSession);
  assert.equal(f.evaluate().kind, 'increase');
  f.fill(f.previousSession, {right: f.exercise.repMax - 1});
  assert.equal(f.evaluate().kind, 'hold');
  f.fill(f.previousSession, {right: undefined});
  assert.equal(f.evaluate().kind, 'incomplete');
  assert.match(f.evaluate().text, /both sides/);
});

test('explicit lighter sessions never replace a normal baseline or earn an increase', () => {
  const code = 'push-a';
  const program = buildProgram({'4:push-a': {light: true}});
  const light = program.find(s => s.code === code && s.light);
  const after = program.find(s => s.code === code && !s.light && s.week > light.week);
  const before = program.filter(s => s.code === code && !s.light && s.week < light.week).at(-1);
  const exercise = after.exercises.find(e => e.isMain);
  const records = new Map();
  const fill = (s, weight) => s.exercises.find(e => e.id === exercise.id).sets.forEach((_, i) => records.set(key(s, exercise, i), {done: true, weight, reps: exercise.repMax, rir: 5}));
  fill(before, 185);
  fill(light, 145);
  const evaluate = session => progressionFor({program, session, exercise, getRecord: id => records.get(id)});
  const advice = evaluate(after);
  assert.equal(advice.kind, 'increase');
  assert.equal(advice.week, before.week);
  assert.equal(advice.load, 185);
  const easy = evaluate(light);
  assert.equal(easy.kind, 'light');
  assert.equal(easy.load, 185);
  assert.match(easy.text, /4\+ RIR/);
  records.clear();
  fill(light, 145);
  assert.equal(evaluate(after).kind, 'calibrate');
});

test('a selected new variation cannot inherit another variation or a future completed session', () => {
  const code = 'legs-a';
  const program = buildProgram({'5:legs-a': {variation: 'ssb-box-squat'}, '7:legs-a': {variation: 'ssb-box-squat'}});
  const ssb = program.find(s => s.code === code && s.week === 5);
  const ssbExercise = ssb.exercises.find(e => e.isMain);
  const records = new Map();
  for (const s of program.filter(s => s.code === code && s !== ssb)) {
    const e = s.exercises.find(e => e.isMain);
    e.sets.forEach((_, i) => records.set(key(s, e, i), {done: true, weight: 245, reps: e.repMax, rir: 2}));
  }
  const advice = progressionFor({program, session: ssb, exercise: ssbExercise, getRecord: id => records.get(id)});
  assert.equal(advice.kind, 'calibrate');
});

test('review points retain normal progression until a lighter session is explicitly selected', () => {
  const current = PROGRAM.find(s => s.code === 'push-a' && s.review);
  const before = PROGRAM.filter(s => s.code === current.code && s.order < current.order).at(-1);
  const e = current.exercises.find(e => e.isMain);
  const records = new Map(before.exercises.find(x => x.id === e.id).sets.map((_, i) => [key(before, e, i), {done: true, weight: 185, reps: e.repMax, rir: 2}]));
  assert.equal(progressionFor({program: PROGRAM, session: current, exercise: e, getRecord: id => records.get(id)}).kind, 'increase');
});

test('selected leg extension has a manual hint and cannot inherit leg-press records', () => {
  const program = buildProgram({'1:legs-a':{quad:'leg-press'},'2:legs-a':{quad:'leg-press'}});
  const current = program.find(s => s.week === 3 && s.code === 'legs-a');
  const exercise = current.exercises.find(e => e.id.endsWith('-legextension'));
  const hint = estimateFor(exercise);
  assert.equal(hint.value, null);
  assert.match(hint.label, /Manual calibration/);
  assert.match(hint.basis, /no verified personal load/);
  const records = new Map();
  for (const s of program.filter(s => s.order < current.order && s.code === current.code)) {
    const e = s.exercises.find(e => e.id.endsWith('-legpress'));
    e.sets.forEach((_, i) => records.set(key(s, e, i), {done: true, weight: 90, reps: 15, rir: 2}));
  }
  assert.equal(progressionFor({program, session: current, exercise, getRecord: id => records.get(id)}).kind, 'calibrate');
});

test('assisted pull-ups can progress assistance and bodyweight core progresses reach', () => {
  const pull = fixture('pull-a', 'pullup');
  pull.fill(pull.previousSession, {weight: -30});
  assert.equal(pull.evaluate().kind, 'increase');
  assert.equal(pull.evaluate().load, -30);
  assert.match(pull.evaluate().text, /Reduce assistance/);
  const core = fixture('legs-a', 'abwheel');
  core.fill(core.previousSession, {weight: undefined});
  assert.equal(core.evaluate().kind, 'increase');
  assert.equal(core.evaluate().load, 0);
  assert.match(core.evaluate().text, /controlled reach/);
});

test('accessory trial values match their own units rather than borrowing unrelated legacy lifts', () => {
  const expected = {incline: 55, lateral: 7.5, pressdown: 30, pullup: 0,
    belt: 70, legcurl: null, shoulder: 35, triceps: 20, pallof: 15,
    abwheel: 0, fly: 10, curl: 20, hammer: 20, pulldown: 60, crunch: 20};
  const exercised = new Set();
  for (const s of PROGRAM.filter(s => !s.light)) for (const e of s.exercises.filter(e => !e.isMain)) {
    const suffix = e.id.split('-').at(-1);
    if (suffix in expected) {
      assert.equal(estimateFor(e).value, expected[suffix], e.id);
      exercised.add(suffix);
    }
    if (suffix === 'calf') assert.equal(estimateFor(e).value, /seated/i.test(e.name) ? 35 : 25);
  }
  assert.equal(exercised.size, Object.keys(expected).length);
  assert.equal(estimateFor({id: 'future-unknown', unit: 'stack lb'}).value, null);
});

test('range-formatted RIR targets use their lower bound without treating missing RIR as zero', () => {
  const f = fixture('push-b');
  f.fill(f.previousSession, {rir: 2});
  assert.equal(f.evaluate().kind, 'increase');
  f.fill(f.previousSession, {rir: 1.5});
  assert.equal(f.evaluate().kind, 'hold');
});

test('seated curls require fresh calibration and cannot inherit unilateral kneeling records', () => {
  const program=buildProgram({'1:legs-a':{curl:'kneeling'},'2:legs-a':{curl:'kneeling'}});
  const current=program.find(p=>p.week===3&&p.code==='legs-a');
  const exercise=current.exercises.find(e=>e.id.endsWith('seated-legcurl'));
  const records=new Map();
  for(const p of program.filter(p=>p.code==='legs-a'&&p.week<3)){
    const old=p.exercises.find(e=>e.id==='legs-a-legcurl');
    old.sets.forEach((_,i)=>records.set(key(p,old,i),{done:true,weight:20,left:15,right:15,rir:2}));
  }
  assert.equal(estimateFor(exercise).value,null);
  assert.equal(exercise.unilateral,false);
  assert.equal(progressionFor({program,session:current,exercise,getRecord:id=>records.get(id)}).kind,'calibrate');
});
