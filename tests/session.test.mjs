import test from 'node:test';
import assert from 'node:assert/strict';
import { setupKey, prescriptionKey, programFromRecords, sessionStarted, freezePrescription } from '../fortis-session.js';

const fakeStore = (records = {}) => ({get: id => records[id], set: (id, value) => {records[id] = value;}, all: () => records});
const current = (store, week = 5, code = 'legs-a') => programFromRecords(id => store.get(id)).find(p => p.week === week && p.code === code);

test('settings rebuild session prescriptions without changing another account or session', () => {
  const a = fakeStore({[setupKey(5, 'legs-a')]: {light: true, variation: 'ssb-box-squat', quad: 'leg-extension'}});
  const b = fakeStore();
  assert.equal(current(a).light, true);
  assert.equal(current(a).exercises[0].variation, 'ssb-box-squat');
  assert(current(a).exercises.some(e => e.id === 'legs-a-legextension'));
  assert.equal(current(b).light, false);
  assert.equal(current(b).exercises[0].variation, 'back-squat');
  assert.equal(current(a, 9).exercises[0].variation, 'back-squat');
});

test('first write freezes the selected prescription and later setup records cannot relabel it', () => {
  const store = fakeStore({[setupKey(5, 'legs-a')]: {light: true, variation: 'ssb-box-squat'}});
  freezePrescription(store, current(store));
  const frozen = structuredClone(store.get(prescriptionKey(5, 'legs-a')));
  store.set(setupKey(5, 'legs-a'), {light: false, variation: 'back-squat', quad: 'leg-extension'});
  assert.equal(current(store).light, true);
  assert.equal(current(store).exercises[0].variation, 'ssb-box-squat');
  assert(!current(store).exercises.some(e => e.id.endsWith('legextension')));
  freezePrescription(store, current(store));
  assert.deepEqual(store.get(prescriptionKey(5, 'legs-a')), frozen);
});

test('a stale displayed setup cannot be frozen over a changed saved prescription', () => {
  const store = fakeStore();
  const displayed = current(store);
  store.set(setupKey(5, 'legs-a'), {light: true});
  assert.throws(() => freezePrescription(store, displayed), /setup changed/);
  assert.equal(store.get(prescriptionKey(5, 'legs-a')), undefined);
});

test('setup locks for all session records including hidden variants, targets and completion', () => {
  const session = current(fakeStore());
  for (const [id, value] of [
    ['ppl-v3:5:legs-a:legs-a-main-ssb-box-squat:2', {weight: 100}],
    ['ppl-v3:adjust:5:legs-a:legs-a-legextension', {load: 20}],
    ['ppl-v3:warmup:5:legs-a:circuit-1-legcurl', {done: true}],
    ['ppl-v3:session:5:legs-a', {finishedAt: '2026-11-07'}],
    [prescriptionKey(5, 'legs-a'), {version: 1}],
  ]) assert.equal(sessionStarted({[id]: value}, session), true, id);
  assert.equal(sessionStarted({[setupKey(5, 'legs-a')]: {light: true}}, session), false);
  assert.equal(sessionStarted({'ppl-v2:5:legs-a:legs-a-main-back-squat:0': {done: true}}, session), false);
  assert.equal(sessionStarted({'ppl-v3:5:push-b:push-b-shoulder:0': {done: true}}, session), false);
});

test('recovery settings persist in records while normal calendar weeks stay normal by default', () => {
  const store = fakeStore({[setupKey(4, 'push-b')]: {light: true}});
  assert.equal(current(store, 4, 'push-b').light, true);
  assert.equal(current(store, 8, 'push-b').light, false);
  assert.equal(current(store, 8, 'push-b').review, true);
  assert.equal(current(store, 4, 'push-b').exercises.find(e => e.id.endsWith('shoulder')).sets.length, 1);
});
