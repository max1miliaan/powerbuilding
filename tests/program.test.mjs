import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PROGRAM, GUIDANCE } from '../fortis-program.js';

const session = (week, code) => PROGRAM.find(s => s.week === week && s.code === code);
const exercise = (week, code, suffix) => session(week, code).exercises.find(e => e.id === `${code}-${suffix}`);

test('57 chronological sessions: 48 core and nine optional, with no E in lighter weeks', () => {
  assert.equal(PROGRAM.length, 57);
  assert.equal(PROGRAM.filter(s => s.code !== 'E').length, 48);
  assert.equal(PROGRAM.filter(s => s.code === 'E').length, 9);
  for (let w = 1; w <= 12; w++) {
    assert.deepEqual(PROGRAM.filter(s => s.week === w).map(s => s.code), w % 4 === 0 ? ['A','B','C','D'] : ['A','B','C','D','E']);
  }
  assert.deepEqual(PROGRAM, [...PROGRAM].sort((a,b) => a.week-b.week || a.code.localeCompare(b.code)));
});

test('every source set, weight, rep and distance matches the independently parsed PDF fixture', () => {
  // SHA-256 of normalized prescription tuples independently extracted from all
  // 366 exercise prescriptions in the 34-page PDF. No private source is shipped.
  // A tuple is [weight lb, reps or null, distance m or null], grouped by week/code.
  // Do not regenerate this fixture from PROGRAM after changing prescriptions.
  const sourceDigest = 'b3164c0910217fc0bc36964cacd0f1b468487b5da937257347fdaefde220c837';
  const normalized = PROGRAM.map(s => ({week:s.week, code:s.code,
    exercises:s.exercises.map(e => e.sets.map(x => [x.weight,x.reps,x.distance]))}));
  assert.equal(PROGRAM.reduce((n,s) => n+s.exercises.length,0),366);
  assert.equal(createHash('sha256').update(JSON.stringify(normalized)).digest('hex'),sourceDigest);
});

test('main lift top and back-off loads match the verified twelve-week source tables', () => {
  const expected = {
    A:[[205,185],[215,190],[220,195],[175,null],[225,200],[230,205],[235,210],[185,null],[230,205],[235,210],[240,215],[190,null]],
    B:[[275,245],[285,255],[295,265],[235,null],[300,270],[305,275],[310,280],[245,null],[310,275],[315,280],[320,285],[255,null]],
    D:[[305,275],[315,285],[325,295],[260,null],[335,300],[340,305],[345,310],[275,null],[345,310],[350,315],[355,320],[280,null]],
  };
  for (const [code, weeks] of Object.entries(expected)) weeks.forEach(([top,back],i) => {
    const work = exercise(i+1,code,'main').sets;
    assert.deepEqual(work.map(s => s.weight),back===null ? [top,top] : [top,back,back]);
    assert.equal(work.some(s => s.label==='Top'),back!==null);
    if (back===null) assert(work.every(s => s.rir==='4+'));
  });
  assert.deepEqual(Array.from({length:12},(_,i)=>exercise(i+1,'C','main').sets[0].weight),[175,180,185,145,180,185,190,150,190,195,200,160]);
});

test('drop segments are only prescribed in their six specified weeks, with independent RIR', () => {
  const dropWeeks = [2,3,6,7,10,11];
  for (let w=1; w<=12; w++) {
    for (const [code,id] of [['A','pressdown'],['C','curl']]) {
      const work=exercise(w,code,id).sets;
      assert.equal(work.some(s=>s.label==='Drop'),dropWeeks.includes(w));
      if(dropWeeks.includes(w)) {
        assert.deepEqual(work.map(s=>s.rir),['1','0–1']);
        assert.equal(work[1].reps,8);
        assert(work[1].weight<work[0].weight);
      }
    }
    const allDrops=session(w,'A').exercises.concat(session(w,'B').exercises,session(w,'C').exercises,session(w,'D').exercises).filter(e=>e.sets.some(s=>s.label==='Drop'));
    assert.equal(allDrops.length,dropWeeks.includes(w)?2:0);
  }
});

test('schema is valid for logging, and bodyweight does not erase pull-up load input', () => {
  const kinds=new Set(['lift','jump','carry','sled','core','pullup']);
  for(const s of PROGRAM) {
    assert.equal(s.block,Math.ceil(s.week/4));
    assert(s.title && s.warmup && s.cue);
    assert.equal(new Set(s.exercises.map(e=>e.id)).size,s.exercises.length);
    for(const e of s.exercises) {
      assert(e.id.startsWith(`${s.code}-`));
      assert(kinds.has(e.kind));
      assert.equal(typeof e.unilateral,'boolean');
      assert(Number.isFinite(e.restSec) && e.restSec>0);
      assert(e.sets.length>0);
      for(const x of e.sets) {
        assert(Number.isFinite(x.weight) && x.weight>=0);
        assert.equal(typeof x.optional,'boolean');
        if(['carry','sled'].includes(e.kind)) {assert.equal(x.reps,null);assert(x.distance>0);}
        else {assert(Number.isInteger(x.reps) && x.reps>0);assert.equal(x.distance,null);}
        if(e.unit==='bodyweight') assert.equal(x.weight,0);
      }
      if(e.kind==='pullup') assert.equal(e.unit,'added lb');
    }
  }
});

test('unilateral, optional-trip and lighter-week execution metadata is retained', () => {
  for(let w=1;w<=12;w++) {
    for(const [code,id] of [['B','legcurl'],['B','split'],['C','lateral'],['D','legcurl'],['D','pallof']]) assert(exercise(w,code,id).unilateral);
    const sled=exercise(w,'D','sled').sets;
    assert.deepEqual(sled.map(s=>s.optional),w%4===0?[false,false]:[false,false,true,true]);
    assert(sled.every(s=>s.distance===15));
    const jump=exercise(w,'D','jump');
    assert.equal(jump.kind,'jump');assert.match(jump.cue,/distance in cm/);
    if(w%4===0) {
      for(const code of ['A','B','C','D']) for(const e of session(w,code).exercises) {
        if(!['jump','sled'].includes(e.kind)) assert(e.sets.every(s=>s.rir==='4+'));
      }
    }
  }
  assert.match(GUIDANCE.join(' '),/load AND rep target/);
  assert.match(GUIDANCE.join(' '),/Calibrate top sets, back-offs and secondary bench independently/);
  assert.match(GUIDANCE.join(' '),/single stalled exercise/);
});
