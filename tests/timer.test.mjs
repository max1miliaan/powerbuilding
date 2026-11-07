import test from 'node:test';
import assert from 'node:assert/strict';
import {RestTimer, formatDuration} from '../fortis-timer.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

function setup(key = 'fortis-rest-v1:guest', storage = new MemoryStorage()) {
  let time = 1_000_000;
  const now = () => time;
  const options = {storage, key, now};
  return {storage, key, timer: new RestTimer(options),
    advance: ms => { time += ms; }, reload: () => new RestTimer(options)};
}

test('duration labels show exact seconds rather than rounded decimal minutes', () => {
  for (const [seconds, expected] of [[0,'0:00'],[59,'0:59'],[60,'1:00'],[75,'1:15'],[150,'2:30'],[180,'3:00']]) {
    assert.equal(formatDuration(seconds), expected);
  }
  assert.equal(formatDuration(74.1), '1:15');
  assert.equal(formatDuration(-5), '0:00');
  assert.equal(formatDuration(Infinity), '0:00');
});

test('absolute deadline stays accurate when callbacks are skipped', () => {
  const {timer, advance} = setup();
  timer.start(180, 'Bench press');
  assert.equal(timer.running, true);
  assert.equal(timer.paused, false);
  assert.equal(timer.label, 'Bench press');
  advance(90_250);
  assert.equal(timer.remaining, 90);
  assert.equal(timer.tick(), false);
  advance(89_750);
  assert.equal(timer.remaining, 0);
  assert.equal(timer.tick(), true);
  assert.equal(timer.tick(), false);
  assert.equal(timer.running, false);
});

test('pause freezes remaining time; adding preserves paused mode; resume continues', () => {
  const {timer, advance} = setup();
  timer.start(75, 'Lateral raise');
  advance(15_000);
  timer.toggle();
  assert.equal(timer.remaining, 60);
  assert.equal(timer.paused, true);
  advance(120_000);
  assert.equal(timer.remaining, 60);
  timer.add();
  assert.equal(timer.remaining, 90);
  assert.equal(timer.paused, true);
  assert.equal(timer.running, false);
  timer.toggle();
  advance(10_000);
  assert.equal(timer.remaining, 80);
  assert.equal(timer.running, true);
  timer.add(30);
  assert.equal(timer.remaining, 110);
  assert.equal(timer.running, true);
  assert.equal(timer.label, 'Lateral raise');
});

test('adding to idle creates a paused timer and clear removes its persisted state', () => {
  const {timer, storage, key, advance} = setup();
  timer.add();
  assert.equal(timer.paused, true);
  assert.equal(timer.remaining, 30);
  assert.equal(timer.label, 'Rest');
  advance(60_000);
  assert.equal(timer.remaining, 30);
  assert(storage.getItem(key));
  timer.clear();
  assert.deepEqual(timer.state, {end:null, paused:0, label:'', context:'', completed:false});
  assert.equal(storage.getItem(key), null);
  assert.equal(timer.tick(), false);
});

test('reload restores a running deadline and a paused duration with its label', () => {
  const {timer, advance, reload} = setup();
  timer.start(180, 'Squat');
  advance(30_000);
  const running = reload();
  assert.equal(running.running, true);
  assert.equal(running.remaining, 150);
  assert.equal(running.label, 'Squat');
  running.toggle();
  advance(500_000);
  const paused = reload();
  assert.equal(paused.paused, true);
  assert.equal(paused.remaining, 150);
  assert.equal(paused.label, 'Squat');
  paused.toggle();
  advance(150_000);
  assert.equal(paused.tick(), true);
  assert.equal(reload().tick(), false);
});

test('expiry during suspension is reported once after restoration', () => {
  const {timer, advance, reload, storage, key} = setup();
  timer.start(90, 'Pull-ups');
  advance(600_000);
  const restored = reload();
  assert.equal(restored.remaining, 0);
  restored.toggle(); // A late pause must not consume the pending expiry.
  assert.equal(restored.tick(), true);
  assert.equal(restored.tick(), false);
  assert.equal(JSON.parse(storage.getItem(key)).completed, true);
  assert.equal(reload().completed, true);
  assert.equal(reload().tick(), false);
});

test('keys isolate account timers without modifying another account', () => {
  const storage = new MemoryStorage();
  const alice = setup('fortis-rest-v1:alice', storage);
  const bob = setup('fortis-rest-v1:bob', storage);
  alice.timer.start(180, 'Alice bench');
  assert.equal(bob.reload().running, false);
  bob.timer.start(60, 'Bob calf raise');
  bob.timer.clear();
  assert.equal(alice.reload().label, 'Alice bench');
  assert.equal(alice.reload().remaining, 180);
});

test('malformed, incompatible and contradictory stored timers are discarded', () => {
  const storage = new MemoryStorage(), key = 'timer', now = () => 1_000_000;
  const payloads = ['not json', 'null', '[]', '{}',
    JSON.stringify({version:99,end:1_010_000,paused:0,label:'Rest'}),
    JSON.stringify({version:1,end:1_010_000,paused:30,label:'Rest'}),
    JSON.stringify({version:1,end:null,paused:-30,label:'Rest'}),
    JSON.stringify({version:1,end:null,paused:1.5,label:'Rest'}),
    JSON.stringify({version:1,end:'1010000',paused:0,label:'Rest'}),
    JSON.stringify({version:1,end:1_000_000+86_401_000,paused:0,label:'Rest'}),
    JSON.stringify({version:1,end:null,paused:30,label:''})];
  for (const raw of payloads) {
    let payload;
    try { payload = JSON.parse(raw); } catch {}
    if (payload && !Array.isArray(payload) && typeof payload === 'object') {
      payload = {...payload, context:'', completed:false};
      storage.setItem(key, JSON.stringify(payload));
    } else storage.setItem(key, raw);
    const timer = new RestTimer({storage,key,now});
    assert.equal(timer.running, false, raw);
    assert.equal(timer.paused, false, raw);
    assert.equal(storage.getItem(key), null, raw);
  }
});

test('blocked storage still permits in-memory start, pause, resume and expiry', () => {
  const blocked = {getItem(){throw Error('blocked');}, setItem(){throw Error('blocked');}, removeItem(){throw Error('blocked');}};
  const {timer, advance} = setup('timer', blocked);
  timer.start(60);
  timer.toggle();
  timer.add();
  timer.toggle();
  advance(90_000);
  assert.equal(timer.tick(), true);
  timer.clear();
});

test('invalid duration input does not destroy a running timer', () => {
  const {timer} = setup();
  timer.start(75);
  for (const value of [-1, Infinity, NaN, '60', 86_401]) {
    assert.throws(() => timer.start(value), RangeError);
    assert.throws(() => timer.add(value), RangeError);
    assert.equal(timer.remaining, 75);
  }
  timer.start(0);
  assert.equal(timer.running, false);
});


test('completed state retains its label and session context across reload without repeating expiry', () => {
  const {timer, advance, reload} = setup();
  timer.start(75, 'Lateral raises', '1:push-a');
  assert.equal(timer.context, '1:push-a');
  advance(75_000);
  assert.equal(timer.tick(), true);
  assert.equal(timer.completed, true);
  assert.equal(timer.label, 'Lateral raises');
  assert.equal(timer.context, '1:push-a');
  assert.equal(timer.running, false);
  assert.equal(timer.paused, false);
  const restored = reload();
  assert.equal(restored.completed, true);
  assert.equal(restored.label, 'Lateral raises');
  assert.equal(restored.context, '1:push-a');
  assert.equal(restored.tick(), false);
  restored.add();
  assert.equal(restored.completed, false);
  assert.equal(restored.paused, true);
  assert.equal(restored.context, '1:push-a');
  restored.start(180, 'Squat', '2:legs-a');
  assert.equal(restored.completed, false);
  assert.equal(restored.context, '2:legs-a');
  restored.clear();
  assert.equal(restored.completed, false);
  assert.equal(restored.context, '');
});
