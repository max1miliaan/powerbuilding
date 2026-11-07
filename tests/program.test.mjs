import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PROGRAM, GUIDANCE, PROGRAM_ID, ROTATION, TRAINING_DAYS } from '../fortis-program.js';
import { PROGRAM as LEGACY_PROGRAM } from '../fortis-program-legacy.js';

const expectedRotation = ['push-a', 'pull-a', 'legs-a', 'push-b', 'pull-b', 'legs-b'];
const expectedDays = ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'];
const normalCounts = {
  'push-a': [3, 3, 3, 2],
  'pull-a': [3, 3, 2, 3],
  'legs-a': [3, 3, 2, 3, 2],
  'push-b': [3, 2, 2, 3, 2],
  'pull-b': [3, 3, 2, 3],
  'legs-b': [2, 3, 3, 3, 2],
};
const mainRanges = {'push-a': [4, 6], 'push-b': [6, 8], 'legs-a': [4, 6], 'legs-b': [3, 5]};
const normalSession = code => PROGRAM.find(s => s.code === code && !s.light);
const setCount = (sessions, pattern) => sessions.flatMap(s => s.exercises)
  .filter(e => pattern.test(e.name)).reduce((n, e) => n + e.sets.length, 0);

test('five training days continue the PPL rotation across all twelve weeks and lighter weeks', () => {
  assert.equal(PROGRAM_ID, 'ppl-v1');
  assert.deepEqual(ROTATION, expectedRotation);
  assert.deepEqual(TRAINING_DAYS, expectedDays);
  assert.equal(PROGRAM.length, 60);
  const exposures = Object.fromEntries(expectedRotation.map(code => [code, 0]));
  PROGRAM.forEach((s, i) => {
    assert.equal(s.code, expectedRotation[i % 6], `rotation at session ${i + 1}`);
    assert.equal(s.day, expectedDays[i % 5]);
    assert.equal(s.week, Math.floor(i / 5) + 1);
    assert.equal(s.block, Math.ceil(s.week / 4));
    assert.equal(s.light, s.week % 4 === 0);
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
        assert.equal(x.rir, s.light ? '4+' : s.code === 'push-b' && e.id.endsWith('-main') ? '2–3' : '2');
        assert.doesNotMatch(x.label, /drop|top|back-off/i);
      }
      if (e.kind === 'pullup') assert.equal(e.unit, 'added lb');
    }
  }
});

test('normal volume and lighter-week reductions preserve strength and avoid extra sessions', () => {
  for (const s of PROGRAM) {
    const expected = s.light
      ? s.exercises.map(e => e.id === `${s.code}-main` ? 2 : 1)
      : normalCounts[s.code];
    assert.deepEqual(s.exercises.map(e => e.sets.length), expected, `${s.week} ${s.code}`);
    if (mainRanges[s.code]) {
      const main = s.exercises[0];
      assert.equal(main.id, `${s.code}-main`);
      assert.equal(main.restSec, 180);
      assert.deepEqual([main.repMin, main.repMax], mainRanges[s.code]);
    }
    assert(!s.exercises.some(e => ['jump', 'sled', 'carry'].includes(e.kind)));
    assert(!s.exercises.some(e => /jump|plyo|\bRDL\b|Romanian|front squat/i.test(e.name)));
    assert(!s.code.includes('optional'));
  }
  assert.equal(PROGRAM.filter(s => s.light).length, 15);
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
    assert(setCount([s], /lateral/i) >= 3);
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
