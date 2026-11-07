// Fortis Carlaw: transcribed from the 34-page training binder.
// Prescriptions are baselines, never automatic increases based on a checkbox.
export const GUIDANCE = [
  'Follow A / B / rest / C / D / optional E / rest. Keep about 48 hours between upper sessions and between lower sessions. Resume after missed days; do not cram catch-up workouts.',
  'All weights are lb. Barbells include the bar; dumbbells are per hand; stacks are displayed settings. Belt squat, seated calf and sled weights are plates added. Pull-up loads are added to bodyweight; negative actual loads mean assistance.',
  'Week 1 calibrates the starting targets. Aim for 2 reps in reserve (RIR) on tops and accessories, 2–3 on back-offs and secondary bench. Calibrate top sets, back-offs and secondary bench independently; do not add another top set.',
  'For normal loading weeks, record an adjustment: calibrated load minus the current printed baseline. Next target is the next printed baseline plus that adjustment, only after success at the prescribed effort. Never add another increase on top. An easy first exposure is calibration, not a separate progression rule.',
  'If you miss reps or the effort target, repeat the last successful load AND rep target at the next normal exposure. Update your adjustment to match the held load. If needed, reduce remaining work 5–10%; do not grind or catch up.',
  'A pull-ups: 3 × 5; add 5 lb at the next loading exposure only after all three sets succeed at 2 RIR. This replaces the printed load sequence after calibration. C pull-ups: 3 × 8, then 9, then 10; after a successful 3 × 10, add 5 lb next block and restart at 8. Reduce assistance before adding weight.',
  'Ab wheel: 2 × 8 / 10 / 12 within each block; extend controlled reach slightly next block only after success. Lighter weeks: 1 × 6 with shorter reach.',
  'Weeks 4, 8 and 12 are lighter: 4+ RIR, no top sets or drops, and no E. Main lifts use 80% of your last successful top (or secondary-bench) load, rounded down to 5 lb. Accessories use 80% of calibrated load, rounded down to an available increment. Printed light loads are examples, not automatic overrides of your actual training.',
  'Drop sets only in weeks 2, 3, 6, 7, 10 and 11: A pressdown and C curl. Initial segment at 1 RIR; immediately reduce to the drop load, target 8 clean reps at 0–1 RIR. This replaces two straight sets. If impractical, use two straight sets at the initial load and initial reps, 2 RIR.',
  'Main lifts rest 3 minutes. Pull-ups rest 2–3 minutes before the next pull-up set. Paired DB work: 20–30 seconds to change exercises, then 90 seconds after both. Curl/split-squat pairs: 90–120 seconds after both sides. Calf/core and arm pairs: 60 seconds. Pair only nearby, free stations.',
  'Jumps are quality power work, not conditioning: reset each rep; stop when landing quality falls. Record best controlled broad-jump distance in week 1. Carries use two 10 m lengths per trip with safe turning space.',
  'D: start sled setup by minute 50. Two 15 m trips; two extras only within 60 minutes. Cut extras first, then the final calf/core set, then the final belt-squat set. B: omit the last split-squat set if needed. Preserve warm-ups, main-lift rest and hamstring work. Week 1 calibration may require capping accessories at two sets.',
  'A single stalled exercise calls for holding or reducing that exercise. Consider an early lighter week when several lifts decline across repeated sessions alongside poor recovery; resume the last successful loading week. Stop a movement causing new pain. Omit optional work when recovery is poor.',
  'Use safeties or a spotter for bench and squat. Unilateral reps are per side; record left/right reps and the harder side’s RIR. Compare equal-rep, equal-effort performances, not triples against fives.',
];

const main = {
  A: [[205,185,5,6],[215,190,5,6],[220,195,5,6],[175,null,5,null],[225,200,4,5],[230,205,4,5],[235,210,4,5],[185,null,4,null],[230,205,3,5],[235,210,3,5],[240,215,3,5],[190,null,3,null]],
  B: [[275,245,5,6],[285,255,5,6],[295,265,5,6],[235,null,5,null],[300,270,4,5],[305,275,4,5],[310,280,4,5],[245,null,4,null],[310,275,3,5],[315,280,3,5],[320,285,3,5],[255,null,3,null]],
  D: [[305,275,5,5],[315,285,5,5],[325,295,5,5],[260,null,4,null],[335,300,4,4],[340,305,4,4],[345,310,4,4],[275,null,3,null],[345,310,3,3],[350,315,3,3],[355,320,3,3],[280,null,3,null]],
};
const secondary = [175,180,185,145,180,185,190,150,190,195,200,160];
const upperWarmup = '2 min easy row/walk and shoulder movement; bar × 10, about 40% max × 5, 55% × 3, 65% × 1; optional 75% × 1. Non-fatiguing ramps, not work sets.';
const lowerWarmup = '2 min easy movement, 5 bodyweight squats, 5 unloaded hinges and ankle rocks. Then the listed jumps and 3–4 non-fatiguing barbell ramps before working sets.';

function sets(count, weight, reps, rir = '2', distance = null) {
  return Array.from({length: count}, (_, i) => ({label: `Set ${i + 1}`, weight, reps, distance, optional: false, rir}));
}
function exercise(code, id, name, unit, work, options = {}) {
  return {id: `${code}-${id}`, name, unit, kind: 'lift', unilateral: false, restSec: 60, pair: null, cue: '', sets: work, ...options};
}
function session(week, code, title, exercises, cue) {
  return {week, block: Math.ceil(week / 4), code, title, warmup: code === 'E' ? '5 min easy movement and light exercise-specific warm-up sets.' : ['A','C'].includes(code) ? upperWarmup : lowerWarmup, cue, exercises};
}
function mainExercise(week, code, name) {
  const [top,back,tr,br] = main[code][week - 1];
  const work = back === null ? sets(2,top,tr,'4+') : [
    {...sets(1,top,tr)[0],label:'Top'},
    {...sets(1,back,br,'2–3')[0],label:'Back-off 1'},
    {...sets(1,back,br,'2–3')[0],label:'Back-off 2'},
  ];
  return exercise(code,'main',name,'total lb',work,{restSec:180,cue:back === null ? 'Easy straight sets; no top set. Adjust from your last successful load.' : 'Calibrate top and back-offs separately. Leave clean reps in reserve.'});
}

export const PROGRAM = [];
for (let week = 1; week <= 12; week++) {
  const b = Math.floor((week - 1) / 4), p = (week - 1) % 4, light = p === 3;
  const rir = light ? '4+' : '2', rep10 = light ? 8 : 10+p, rep12 = light ? 12 : [12,14,15][p];
  const dbLat = light ? [10,10,15][b] : [15,15,20][b];
  const row = light ? [40,45,50][b] : [55,60,65][b];
  const curl = light ? [20,20,25][b] : [25,30,35][b];
  const legCurl = light ? [20,20,25][b] : [25,30,35][b];
  const pressdown = light ? [30,35,40][b] : [40,45,50][b];
  const drop = !light && p > 0;
  const dropWork = (weight, dropWeight, reps) => [
    {...sets(1,weight,reps,'1')[0],label:'Initial'},
    {...sets(1,dropWeight,8,'0–1')[0],label:'Drop'},
  ];
  const dropCue = 'One drop only: initial at 1 RIR, immediately reduce, then 8 clean reps at 0–1 RIR. Finish the paired exercise’s normal sets.';
  const E = (code,id,name,unit,n,weight,reps,options={}) => exercise(code,id,name,unit,sets(n,weight,reps,rir),options);
  const n1 = light ? 1 : 2, n2 = light ? 2 : 3;
  PROGRAM.push(session(week,'A','Upper / Bench',[
    mainExercise(week,'A','Barbell bench press'),
    E('A','pullup','Weighted pull-up','added lb',n2,light ? 0 : 10+5*(b*3+p),5,{kind:'pullup',restSec:150,pair:'2',cue:light ? 'Use assistance as needed for 4+ RIR.' : '2–3 min before your next pull-up set; interleave lateral raises only if convenient.'}),
    E('A','lateral','DB lateral raise','per hand',n1,dbLat,rep12,{pair:'2',restSec:150}),
    E('A','incline','Incline DB press','per hand',n2,light ? [50,55,60][b] : [65,70,75][b],rep10,{pair:'3',restSec:90}),
    E('A','row','Chest-supported DB row','per hand',n1,row,rep10,{pair:'3',restSec:90}),
    exercise('A','pressdown','Cable pressdown','stack lb',drop ? dropWork(pressdown,[30,35,40][b],rep12) : sets(n1,pressdown,rep12,rir),{cue:drop ? dropCue : ''}),
  ],light ? 'Lighter week: 4+ RIR, no drops. Finish comfortably within 60 min.' : 'Warm-up 8–10 min; bench + pull-ups 22–26 min; accessories 16–20 min. Finish within 60 min. Drops use their own RIR target.'));

  PROGRAM.push(session(week,'B','Lower / Squat',[
    exercise('B','jump','Floor countermovement jump','bodyweight',sets(n2,0,3,null),{kind:'jump',restSec:75,cue:'60–90 sec; reset each rep, land under control. No box.'}),
    mainExercise(week,'B','Back squat'),
    E('B','legcurl','Kneeling leg curl','stack lb',n2,legCurl,rep10,{unilateral:true,pair:'3',restSec:120}),
    E('B','split','DB split squat','per hand',n2,light ? [20,25,30][b] : [30,35,40][b],light ? 8 : 8+p,{unilateral:true,pair:'3',restSec:120,cue:'90–120 sec after both exercises and both sides. Omit final split-squat set if behind.'}),
    E('B','calf','Standing DB calf raise','per hand',n2,light ? [20,25,30][b] : [30,35,40][b],rep12,{pair:'4',cue:'Bilateral on stable floor; do not balance on loose plates.'}),
    E('B','abwheel','Ab wheel rollout','bodyweight',n1,0,light ? 6 : [8,10,12][p],{kind:'core',pair:'4',cue:light ? 'Shorter controlled reach.' : 'Two paired rounds, then final calf set alone.'}),
  ],'Warm-up + jumps 8–10 min; ramp + squat 18–22 min; accessories 22–26 min. Finish by 60 min. If behind, omit final split-squat set; preserve hamstring work and squat rest.'));

  PROGRAM.push(session(week,'C','Upper / Pull-ups + Volume',[
    exercise('C','main','Barbell bench press','total lb',sets(n2,secondary[week-1],light ? (b===2 ? 5 : 6) : (b===2 ? 6 : 8),light ? '4+' : '2–3'),{restSec:180,cue:'Moderate-load straight sets; rest 2–3 min.'}),
    E('C','pullup','Pull-up','added lb',n2,light ? 0 : b*5,light ? 5 : 8+p,{kind:'pullup',pair:'2',restSec:150,cue:light ? 'Use assistance as needed for 4+ RIR.' : 'Advance from 8 to 9 to 10 only after success; +5 lb next block after successful 3 × 10.'}),
    E('C','lateral','Cable lateral raise','stack lb',n1,light ? [7.5,7.5,10][b] : [10,10,15][b],rep12,{unilateral:true,pair:'2',restSec:150}),
    E('C','row','Chest-supported DB row','per hand',n1,row,rep10,{pair:'3',restSec:90,cue:'Controlled upper-back emphasis; keep chest supported.'}),
    E('C','shoulder','Seated DB shoulder press','per hand',n1,light ? [35,40,40][b] : [45,50,55][b],rep10,{pair:'3',restSec:90}),
    exercise('C','curl','DB curl','per hand',drop ? dropWork(curl,[20,25,25][b],rep10) : sets(n1,curl,rep10,rir),{pair:'4',cue:drop ? dropCue : ''}),
    E('C','triceps','Overhead cable triceps','stack lb',n1,light ? [20,25,30][b] : [30,35,40][b],rep12,{pair:'4'}),
  ],'Warm-up 8–10 min; bench + pull-ups 20–24 min; accessories 18–22 min. Finish by 60 min. Bench 2–3 RIR; accessories 2; drops 1 then 0–1. Lighter week: 4+ RIR throughout.'));

  PROGRAM.push(session(week,'D','Lower / Deadlift',[
    exercise('D','jump','Standing broad jump','bodyweight',sets(n2,0,2,null),{kind:'jump',restSec:75,cue:'60–90 sec; record best controlled distance in cm. Reset and land cleanly.'}),
    mainExercise(week,'D','Conventional deadlift'),
    E('D','belt','Belt squat','added lb',n2,light ? [70,85,100][b] : [90,110,130][b],rep10,{pair:'3',restSec:90}),
    E('D','legcurl','Kneeling leg curl','stack lb',n2,legCurl,rep10,{unilateral:true,pair:'3',restSec:90}),
    E('D','calf','Seated calf raise','added lb',n1,light ? [35,40,50][b] : [45,55,65][b],rep12,{pair:'4'}),
    E('D','pallof','Pallof press','stack lb',n1,light ? [15,20,20][b] : [20,25,30][b],light ? 8 : 10,{kind:'core',unilateral:true,pair:'4'}),
    exercise('D','sled','Sled push','added lb',sets(light ? 2 : 4,light ? [50,65,75][b] : [90,110,130][b],null,null,15).map((s,i)=>({...s,optional:i>=2,label:i>=2 ? `Extra ${i-1}` : `Trip ${i+1}`})),{kind:'sled',cue:light ? 'Easy effort 4/10; two trips only.' : 'Effort 6–7/10. Two required trips; extras only if finished by 60 min.'}),
  ],'Start sled setup by minute 50; allow 8–10 min. Cut extras first, then final calf/core set, then final belt-squat set. Preserve warm-up, main-lift rest and hamstring work.'));

  if (!light) PROGRAM.push(session(week,'E','Optional / Arms + Carries',[
    exercise('E','hammer','DB hammer curl','per hand',sets(2,[25,30,35][b],10+p,'3'),{pair:'1'}),
    exercise('E','pressdown','Cable pressdown','stack lb',sets(2,[40,45,50][b],rep12,'3'),{pair:'1'}),
    exercise('E','lateral','DB lateral raise','per hand',sets(2,[15,15,20][b],rep12,'3'),{pair:'2'}),
    exercise('E','fly','Chest-supported rear-delt fly','per hand',sets(2,[15,15,20][b],rep12,'3'),{pair:'2'}),
    exercise('E','carry','DB farmer carry','per hand',sets(3,[60,65,70][b],null,null,20),{kind:'carry',cue:'Effort 6/10; two 10 m lengths per trip, safe turning space.'}),
    exercise('E','sled','Backward sled drag','added lb',sets(4,[45,55,65][b],null,null,15),{kind:'sled',cue:'Effort 6/10. Same sled and lane for comparisons.'}),
  ],'Optional recovery-dependent session. Warm-up 5 min; accessories 15–20 min; carries + drags 14–18 min. Under 45 min. Accessories 3 RIR; carries and sleds effort 6/10.'));
}
