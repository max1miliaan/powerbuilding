import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PROGRAM, GUIDANCE, PROGRAM_ID, ROTATION, TRAINING_DAYS, buildProgram } from '../fortis-program.js';
import { PROGRAM as LEGACY_PROGRAM } from '../fortis-program-legacy.js';

const expectedRotation = ['push-a', 'pull-a', 'legs-a', 'push-b', 'pull-b', 'legs-b'];
const expectedDays = ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'];
const normalCounts = {
  'push-a': [3, 3, 3, 2],
  'pull-a': [3, 3, 2, 3],
  'legs-a': [3, 3, 2, 3, 2],
  'push-b': [3, 3, 1, 2, 2, 2],
  'pull-b': [3, 3, 2, 3],
  'legs-b': [2, 3, 3, 3, 2],
};
const mainRanges = {'push-a': [4, 6], 'push-b': [6, 8], 'legs-a': [4, 6], 'legs-b': [3, 5]};
const normalSession = code => PROGRAM.find(s => s.code === code && !s.light);
const setCount = (sessions, pattern) => sessions.flatMap(s => s.exercises)
  .filter(e => pattern.test(e.name)).reduce((n, e) => n + e.sets.length, 0);

test('five training days continue the PPL rotation across all twelve weeks and lighter weeks', () => {
  assert.equal(PROGRAM_ID, 'ppl-v3');
  assert.deepEqual(ROTATION, expectedRotation);
  assert.deepEqual(TRAINING_DAYS, expectedDays);
  assert.equal(PROGRAM.length, 60);
  const exposures = Object.fromEntries(expectedRotation.map(code => [code, 0]));
  PROGRAM.forEach((s, i) => {
    assert.equal(s.code, expectedRotation[i % 6], `rotation at session ${i + 1}`);
    assert.equal(s.day, expectedDays[i % 5]);
    assert.equal(s.week, Math.floor(i / 5) + 1);
    assert.equal(s.block, Math.ceil(s.week / 4));
    assert.equal(s.light, false);
    assert.equal(s.review, s.week % 4 === 0);
    assert.equal(s.exposure, ++exposures[s.code]);
  });
  assert.deepEqual(Object.values(exposures), [10, 10, 10, 10, 10, 10]);
  for (let week = 1; week <= 12; week++) {
    assert.equal(PROGRAM.filter(s => s.week === week).length, 5);
  }
  // Monday is not always Push A: both ordinary and deload boundaries keep rolling.
  assert.equal(PROGRAM[5].code, 'legs-b');
  assert.equal(PROGRAM[15].code, 'push-b');
  assert.equal(PROGRAM[20].code, 'legs-a');
  assert.equal(PROGRAM[40].code, 'pull-b');
});

test('logging schema uses rep ranges and fresh calibration instead of inherited Fortis pounds', () => {
  const kinds = new Set(['lift', 'core', 'pullup']);
  for (const s of PROGRAM) {
    assert(s.title && s.warmup && s.cue);
    assert.equal(typeof s.warmup, 'string');
    assert.equal(new Set(s.exercises.map(e => e.id)).size, s.exercises.length);
    for (const e of s.exercises) {
      assert(e.id.startsWith(`${s.code}-`));
      assert(e.name && e.unit);
      assert(kinds.has(e.kind));
      assert.equal(typeof e.unilateral, 'boolean');
      assert.equal(typeof e.cue, 'string');
      assert(Number.isFinite(e.restSec) && e.restSec > 0);
      assert(e.pair === null || typeof e.pair === 'string');
      assert(Number.isInteger(e.repMin) && e.repMin > 0);
      assert(Number.isInteger(e.repMax) && e.repMax >= e.repMin);
      assert(e.sets.length > 0);
      for (const x of e.sets) {
        assert.equal(x.reps, e.repMin);
        assert.equal(x.weight, e.unit === 'bodyweight' || e.kind === 'pullup' ? 0 : null,
          `${s.week} ${e.id}: a replacement movement must not inherit an old target`);
        assert.equal(x.distance, null);
        assert.equal(x.optional, false);
        assert.equal(x.rir, s.light ? '4+' : s.code === 'push-b' && (e.isMain || e.kind === 'core') ? '2–3' : '2');
        assert.doesNotMatch(x.label, /drop|top|back-off/i);
      }
      if (e.kind === 'pullup') assert.equal(e.unit, 'added lb');
    }
  }
});

test('normal volume and lighter-week reductions preserve strength and avoid extra sessions', () => {
  for (const s of PROGRAM) {
    const expected = s.light
      ? s.exercises.map(e => e.isMain ? 2 : 1)
      : normalCounts[s.code];
    assert.deepEqual(s.exercises.map(e => e.sets.length), expected, `${s.week} ${s.code}`);
    if (mainRanges[s.code]) {
      const main = s.exercises[0];
      assert(main.isMain);
      assert(main.id.startsWith(`${s.code}-main`));
      assert.equal(main.restSec, 180);
      assert.deepEqual([main.repMin, main.repMax], mainRanges[s.code]);
    }
    assert(!s.exercises.some(e => ['jump', 'sled', 'carry'].includes(e.kind)));
    assert(!s.exercises.some(e => /jump|plyo|\bRDL\b|Romanian|front squat/i.test(e.name)));
    assert(!s.code.includes('optional'));
  }
  assert.equal(PROGRAM.filter(s => s.light).length, 0);
  assert.equal(PROGRAM.filter(s => s.review).length, 15);
  // Deadlifts belong to Legs B, never the pull session directly before a leg day.
  const deadlifts = PROGRAM.flatMap(s => s.exercises.filter(e => /deadlift/i.test(e.name)).map(e => [s.code, e]));
  assert.equal(deadlifts.length, 10);
  assert(deadlifts.every(([code, e]) => code === 'legs-b' && e.sets.length === 2));
});

test('both variants cover required muscle groups without depending on an optional fifth workout', () => {
  const push = ['push-a', 'push-b'].map(normalSession);
  const pull = ['pull-a', 'pull-b'].map(normalSession);
  const legs = ['legs-a', 'legs-b'].map(normalSession);
  for (const s of push) {
    assert(setCount([s], /bench/i) >= 3, `${s.code} retains bench practice`);
    assert(setCount([s], /lateral/i) >= 2);
    assert(setCount([s], /pressdown|triceps/i) >= 2);
  }
  for (const s of pull) {
    assert(setCount([s], /row/i) >= 3);
    assert(setCount([s], /pull-up|pulldown/i) >= 3);
    assert(setCount([s], /rear|reverse pec/i) >= 2);
    assert(setCount([s], /curl/i) >= 3);
  }
  for (const s of legs) {
    assert(setCount([s], /squat/i) >= 3);
    assert(setCount([s], /leg curl/i) >= 3);
    assert(setCount([s], /calf/i) >= 3);
    assert(s.exercises.some(e => e.kind === 'core'));
    const curl = s.exercises.find(e => /kneeling leg curl/i.test(e.name));
    assert(curl, 'retain available kneeling curl rather than assuming a seated machine');
    assert(curl.unilateral);
  }
  assert(setCount(pull, /row/i) >= setCount(pull, /pull-up|pulldown/i));
  for (const s of PROGRAM) {
    for (const e of s.exercises.filter(e => /lateral|Pallof|kneeling leg curl/i.test(e.name))) {
      assert(e.unilateral, `${e.id} must log both sides`);
    }
  }
});

test('Wenning-inspired preparation and progression remain explicit guidance', () => {
  assert(GUIDANCE.length > 0);
  const guidance = GUIDANCE.join(' ');
  assert.match(guidance, /60/);
  assert.match(guidance, /calibrat/i);
  assert.match(guidance, /RIR|reps in reserve/i);
  assert.match(guidance, /lighter|deload/i);
  for (const code of expectedRotation) {
    assert.match(normalSession(code).warmup, /Wenning|circuit/i);
  }
});

test('the archived Fortis prescription retains the independent PDF golden fixture', () => {
  // This fixture was independently extracted from the original 34-page binder.
  // Never regenerate it from either the revised program or the archived module.
  const sourceDigest = 'b3164c0910217fc0bc36964cacd0f1b468487b5da937257347fdaefde220c837';
  assert.equal(LEGACY_PROGRAM.length, 57);
  assert.equal(LEGACY_PROGRAM.reduce((n, s) => n + s.exercises.length, 0), 366);
  const normalized = LEGACY_PROGRAM.map(s => ({week: s.week, code: s.code,
    exercises: s.exercises.map(e => e.sets.map(x => [x.weight, x.reps, x.distance]))}));
  assert.equal(createHash('sha256').update(JSON.stringify(normalized)).digest('hex'), sourceDigest);
});

test('GitHub Pages entrypoints remain byte-identical', async () => {
  const [index, alias] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url)),
    readFile(new URL('../powerbuilding.html', import.meta.url)),
  ]);
  assert(index.equals(alias));
});


test('default compound anchors remain stable; only validated explicit selections change variations', () => {
  const settings = {'5:legs-a': {variation: 'ssb-box-squat'}, '5:legs-b': {variation: 'paused-deadlift'}};
  const selected = buildProgram(settings);
  for (const s of PROGRAM) {
    const e = s.exercises.find(e => e.isMain); if (!e) continue;
    const expected = {'push-a': 'bench', 'push-b': 'paused-bench', 'legs-a': 'back-squat', 'legs-b': 'conventional-deadlift'};
    assert.equal(e.variation, expected[s.code]);
    assert(s.warmup.toLowerCase().includes(e.name.toLowerCase()));
    assert(e.sets.every(x => x.weight === null));
  }
  for (const [code, variation] of [['legs-a', 'ssb-box-squat'], ['legs-b', 'paused-deadlift']]) {
    const changed = selected.find(s => s.week === 5 && s.code === code);
    const original = PROGRAM.find(s => s.week === 5 && s.code === code);
    const e = changed.exercises.find(e => e.isMain);
    assert.equal(e.variation, variation);
    assert.notEqual(e.id, original.exercises[0].id);
    assert(changed.warmup.toLowerCase().includes(e.name.toLowerCase()));
    assert.match(e.cue, /multiple exposures/);
  }
  assert.deepEqual(buildProgram({'5:legs-a': {variation: 'paused-deadlift'}, '5:legs-b': {variation: 'ssb-box-squat'}, '1:push-a': {variation: 'ssb-box-squat'}}), PROGRAM);
});

test('review points never deload automatically; explicit lighter choices reduce only selected sessions', () => {
  const settings = Object.fromEntries(PROGRAM.filter(s => s.review).map(s => [`${s.week}:${s.code}`, {light: true}]));
  settings['5:legs-a'] = {light: true, variation: 'ssb-box-squat'};
  const selected = buildProgram(settings);
  assert.equal(selected.filter(s => s.light).length, 16);
  for (const s of selected) {
    assert.equal(s.review, s.week % 4 === 0);
    for (const e of s.exercises) {
      assert.equal(e.sets.length, s.light ? e.isMain ? 2 : 1 : normalCounts[s.code][s.exercises.indexOf(e)]);
      assert(e.sets.every(x => s.light ? x.rir === '4+' : x.rir !== '4+'));
    }
    if (s.light) assert(!s.warmup.includes('second round'));
  }
  assert.equal(selected.find(s => s.week === 5 && s.code === 'legs-a').exercises[0].variation, 'ssb-box-squat');
  assert.deepEqual(buildProgram({'1:push-a': {light: 'true'}, '1:pull-a': {light: 1}}), PROGRAM);
  assert.deepEqual(buildProgram(null), PROGRAM);
  assert.deepEqual(PROGRAM, buildProgram(), 'building choices must not mutate default prescriptions');
});

test('optional leg extension preserves quad work with separate calibration and identifiers', () => {
  const selected = buildProgram({'1:legs-a': {quad: 'leg-extension'}, '2:legs-b': {quad: 'leg-extension'}, '1:push-a': {quad: 'leg-extension'}});
  const s = selected.find(s => s.week === 1 && s.code === 'legs-a');
  const extension = s.exercises.find(e => e.id.endsWith('-legextension'));
  assert(extension);
  assert.equal(extension.sets.length, 2);
  assert.deepEqual([extension.repMin, extension.repMax], [10, 15]);
  assert.equal(extension.restSec, 75);
  assert(extension.sets.every(x => x.weight === null));
  assert.match(extension.cue, /confirming/);
  assert(!s.exercises.some(e => e.id.endsWith('-legpress')));
  assert.equal(selected.flatMap(s => s.exercises).filter(e => e.id.endsWith('-legextension')).length, 1);
  assert.deepEqual(buildProgram({'1:legs-a': {quad: 'unknown'}}), PROGRAM);
});

test('required core covers three patterns and preparation cannot replace it', () => {
  const normal=expectedRotation.map(normalSession);
  const core=normal.flatMap(s=>s.exercises.filter(e=>e.kind==='core'));
  assert.deepEqual(core.map(e=>e.name).sort(),['Ab wheel rollout','Kneeling cable crunch','Pallof press'].sort());
  assert.equal(core.reduce((n,e)=>n+e.sets.length,0),6);
  assert(!normalSession('pull-b').exercises.some(e=>e.kind==='core'));
  for(const s of PROGRAM){
    assert.match(s.warmup,/8\+ RIR/);
    assert.doesNotMatch(s.warmup,/cable curl|cable fly/);
    if(s.light)assert(!s.warmup.includes('second round'));
  }
});


test('first PPL archive stays unchanged for existing history', async () => {
  const source=await readFile(new URL('../fortis-program-ppl-v1.js',import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'),'360af7069d22ae939205825c5e1a2fba2d09f7410430e51236df94d6c21f9727');
});


test('second PPL archive preserves the exact pre-audit source for read-only history', async () => {
  const source = await readFile(new URL('../fortis-program-ppl-v2.js', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'), '071681b4f2d931a2f0a398bb79465849fca7d4f1bdfb3c761100637ad26d155c');
});
