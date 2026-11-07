import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM, buildProgram } from '../fortis-program.js';
import { warmupSteps, warmupCounts, warmupKey } from '../fortis-warmups.js';

test('all sixty sessions have separate circuit steps and lift-specific ramps with unique IDs', () => {
  for (const session of PROGRAM) {
    const steps = warmupSteps(session);
    assert.equal(steps.filter(s => s.phase === 'circuit').length, 3);
    assert.equal(new Set(steps.map(s => s.id)).size, steps.length);
    assert(steps.every(s => s.name && s.target && s.cue));
    const ramps = steps.filter(s => s.phase === 'ramp');
    assert(ramps.every(s => s.name.includes(session.exercises[0].name)));
    assert.equal(ramps.at(-1).optional, true);
    assert.equal(ramps[0].optional, false);
    assert(steps.every(s => !session.exercises.some(e => e.id === s.id)));
  }
});

test('lower circuits include both sides and floor-height deadlift preparation', () => {
  for (const code of ['legs-a', 'legs-b']) {
    const session = PROGRAM.find(s => s.code === code);
    const steps = warmupSteps(session);
    assert.equal(steps.filter(s => s.phase === 'repeat').length, 0);
    assert(steps.filter(s => s.target.includes('/ side')).every(s => /both sides/.test(s.cue)));
    if (code === 'legs-b') {
      assert.match(steps.find(s => s.phase === 'ramp').cue, /normal floor height/);
      assert.equal(steps.find(s => s.phase === 'ramp').target, '5 reps');
    }
  }
});

test('optional second rounds appear only for normal upper sessions', () => {
  const light = buildProgram(Object.fromEntries(PROGRAM.map(p => [`${p.week}:${p.code}`, {light: true}])));
  for (const session of PROGRAM) {
    const repeats = warmupSteps(session).filter(s => s.phase === 'repeat');
    assert.equal(repeats.length, session.code.startsWith('legs') ? 0 : 3);
    assert(repeats.every(s => s.optional));
  }
  assert(light.every(s => warmupSteps(s).every(step => step.phase !== 'repeat')));
});

test('ramp IDs and instructions distinguish optional main-lift variations', () => {
  const selected = buildProgram({'1:legs-a': {variation: 'ssb-box-squat'}, '2:legs-b': {variation: 'paused-deadlift'}});
  for (const [week, code, cue] of [[1, 'legs-a', /actual SSB/], [2, 'legs-b', /pause just off the floor/]]) {
    const normal = PROGRAM.find(p => p.week === week && p.code === code);
    const variant = selected.find(p => p.week === week && p.code === code);
    const standardIds = warmupSteps(normal).filter(s => s.phase === 'ramp').map(s => s.id);
    const ramps = warmupSteps(variant).filter(s => s.phase === 'ramp');
    assert(ramps.every(s => cue.test(s.cue)));
    assert(ramps.every(s => !standardIds.includes(s.id)));
  }
  const pausedBench = PROGRAM.find(p => p.code === 'push-b');
  assert(warmupSteps(pausedBench).filter(s => s.phase === 'ramp').every(s => /chest pause/.test(s.cue)));
});

test('warm-up counts exclude optional steps, working records and other sessions', () => {
  const session = PROGRAM[0], steps = warmupSteps(session), records = {};
  for (const step of steps.filter(s => !s.optional)) records[warmupKey(session, step)] = {done: true};
  const optional = steps.find(s => s.optional);
  records[warmupKey(session, optional)] = {done: true};
  records['ppl-v3:1:push-a:push-a-main-bench:0'] = {done: true};
  assert.deepEqual(warmupCounts(session, id => records[id]), {total: 6, done: 6, extra: 1, saved: true});
  assert.equal(warmupCounts(PROGRAM[6], id => records[id]).done, 0);
  records[warmupKey(session, steps[0])] = {done: false};
  assert.equal(warmupCounts(session, id => records[id]).done, 5);
});
