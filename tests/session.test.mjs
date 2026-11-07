import test from 'node:test';
import assert from 'node:assert/strict';
import { setupKey, prescriptionKey, programFromRecords, sessionStarted, freezePrescription } from '../fortis-session.js';
import { warmupSteps } from '../fortis-warmups.js';

const fakeStore = (records = {}) => ({get: id => records[id], set: (id, value) => {records[id] = value;}, all: () => records});
const current = (store, week = 5, code = 'legs-a') => programFromRecords(id => store.get(id)).find(p => p.week === week && p.code === code);

test('earlier frozen sessions retain kneeling curls, quad choice and warm-up IDs without writes', () => {
  for(const quad of ['leg-press','leg-extension']){
    const records = {[prescriptionKey(5,'legs-a')]:{version:1,settings:{light:false,variation:'back-squat',quad}}};
    const before=JSON.stringify(records),store=fakeStore(records),p=current(store);
    assert(p.exercises.find(e=>e.id==='legs-a-legcurl').unilateral);
    assert(p.exercises.some(e=>e.id===(quad==='leg-press'?'legs-a-legpress':'legs-a-legextension')));
    const warmup=warmupSteps(p).find(s=>s.id==='circuit-1-legcurl');
    assert.equal(warmup.name,'Light kneeling leg curl');assert.equal(warmup.target,'10–12 reps / side');
    assert(!p.exercises.some(e=>e.id.includes('seated-leg')));
    freezePrescription(store,p);
    assert.equal(JSON.stringify(records),before);
  }
});

test('new snapshots freeze the confirmed seated exercises and distinct warm-up IDs', () => {
  const store=fakeStore(),p=current(store);
  freezePrescription(store,p);
  assert.equal(store.get(prescriptionKey(5,'legs-a')).version,2);
  assert.equal(store.get(prescriptionKey(5,'legs-a')).settings.curl,'seated');
  assert.equal(store.get(prescriptionKey(5,'legs-a')).settings.quad,'seated-leg-extension');
  assert(warmupSteps(p).some(s=>s.id==='circuit-1-seated-legcurl'&&s.target==='10–12 reps'));
  store.set(setupKey(5,'legs-a'),{curl:'kneeling',quad:'leg-press'});
  assert(current(store).exercises.some(e=>e.id==='legs-a-seated-legcurl'));
});

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
  assert(current(store).exercises.some(e => e.id.endsWith('seated-legextension')));
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
