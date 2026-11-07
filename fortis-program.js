// Fortis Carlaw: new prescription, separate from the archived binder plan.
export const PROGRAM_ID = 'ppl-v2';
export const ROTATION = ['push-a','pull-a','legs-a','push-b','pull-b','legs-b'];
export const TRAINING_DAYS = ['Mon','Tue','Thu','Fri','Sat'];
export const GUIDANCE = [
  'Train Mon / Tue / Thu / Fri / Sat, or your equivalent. Continue Push / Pull / Legs across week boundaries; never reset to Push on Monday. Resume the next session after a missed day; do not cram catch-up workouts.',
  'A and B are variations. Each pattern averages 1.67 sessions per week. Bench is practised on both push days; heavy squat and deadlift each recur about every 8–9 days. These are compound strength movements, not explosive jump or Olympic-lift work.',
  'All loads are lb. Barbells include the bar; dumbbells are per hand; cable stacks are displayed settings. Belt squat and seated calf are plates added. Leg press follows its marked loading convention. Pull-up loads are added to bodyweight; negative values mean assistance.',
  'Calibrate every exercise from current performance. No old binder poundages transfer automatically. Choose a working load at the low end of the rep range with 2 clean reps in reserve (RIR), or 2–3 on Push B bench.',
  'Progress after successful performed exposures, not dates or checkboxes. When every set reaches the top of the range at the intended RIR, add the smallest available increment next time and return to the low end. Enter working loads manually; keep machine, seat, grip and range consistent.',
  'After missed reps or effort targets, repeat the last successful load AND reps. Reduce remaining work 5–10% if needed; do not grind or catch up. Adjust a single stalled exercise individually.',
  'Weeks 4, 8 and 12 are lighter but the PPL sequence keeps rolling. Two easy sets on the main lift, one per accessory, all at 4+ RIR. Choose lighter loads from actual performance, not a fixed machine percentage. Do one easy circuit round.',
  'Warm-ups are scaled Wenning-inspired circuits, not the full high-volume protocol. Start with one easy round on all days at roughly 8+ RIR and effort 3–4/10. A second upper round is optional only if it improves readiness without fatigue or exceeding the time budget. Circuit plus lift-specific ramps should take 10–12 minutes total. Warm-up work is not hard bodybuilding volume.',
  'Rest 3 minutes between main-lift sets, 2–3 for pull-ups, 90 seconds for other compounds and rows, and 60–75 seconds for isolation work. Pair only nearby free accessory stations. Never shorten main-lift rest to add accessories.',
  'Keep the 60-minute cap. Kneeling curls and unilateral cable work need time for both sides. If behind, omit the final leg-press/belt-squat or calf set; on upper days trim the final isolation set. Preserve preparation, main rest and hamstring work. No required sled finisher.',
  'No plyometrics, RDLs or front squats. Use Fortis kneeling curls, supported rows, leg press, Wenning belt squat and cables. Do not assume seated curls, machine chest/shoulder presses or standing calf machines are available.',
  'Direct core is required: cable crunches on Push B, ab wheel on Legs A, and Pallof press on Legs B; six normal sets per six-session rotation (about five per week). Warm-up core does not count toward this total. Rear delts, side delts and calves are also included. Squats, leg press, belt squats and deadlifts also train glutes. Coverage does not diagnose physical imbalance. Match unilateral reps and record the harder side’s RIR; do not automatically add weaker-side work.',
  'Use safeties or a spotter for bench and squat. Stop new pain. If several lifts decline over repeated exposures with poor recovery, take a lighter week and resume conservatively.',
  'Variation blocks: Push A stays regular bench; Push B uses a one-second paused bench. Legs A uses back squat in weeks 1–4 and 9–12, SSB box squat in weeks 5–8. Legs B uses floor conventional deadlift in weeks 1–4 and 9–12, a one-second paused floor deadlift in weeks 5–8. Keep each variant stable within its block and calibrate independently; use actual SSB bar weight. Lighter weeks retain the block’s variation.',
  'Earlier Fortis logs remain available in History and in your export. They are not imported into the new PPL targets.',
];
const circuits = {
  push:'One easy round: light cable row × 12–15; rope pressdown × 12–15; scapular push-up × 8–10.',
  pull:'One easy round: light cable row × 12–15; straight-arm pulldown × 12–15; band pull-apart × 12–15.',
  squat:'Start with one easy round: light Atlantis kneeling leg curl × 10–12 per side; bodyweight squat × 8–10; dead bug × 4 per side.',
  deadlift:'Start with one easy round: light Atlantis kneeling leg curl × 10–12 per side; bodyweight glute bridge × 10; bird dog × 4 per side.',
};
// [id, name, unit, normal set count, rep minimum, rep maximum, options]
const templates = [
  {code:'push-a',label:'Push A',title:'Push A / Bench strength',circuit:'push',cue:'Bench first, then bodybuilding work. Allow 12 min preparation, 12 min bench and 25–30 min accessories/transitions. Trim a final isolation set if needed.',exercises:[
    ['main','Barbell bench press','total lb',3,4,6,{restSec:180}],
    ['incline','Incline DB press','per hand',3,8,12,{restSec:90}],
    ['lateral','Cable lateral raise','stack lb',3,12,20,{unilateral:true,restSec:75,pair:'1'}],
    ['pressdown','Cable pressdown','stack lb',2,10,15,{pair:'1'}],
  ]},
  {code:'pull-a',label:'Pull A',title:'Pull A / Pull-ups + back',circuit:'pull',cue:'Pull-ups are the strength anchor. Use Fortis supported rows and rear-delt equipment, or a cable reverse fly. Pair only nearby free stations.',exercises:[
    ['pullup','Weighted / assisted pull-up','added lb',3,5,8,{kind:'pullup',restSec:150,cue:'Negative working load means assistance; reduce assistance before adding weight.'}],
    ['row','Fortis chest-supported row','machine lb',3,8,12,{restSec:90,cue:'Use the same supported station and loading convention each time.'}],
    ['rear','Rear-delt machine / cable reverse fly','stack lb',2,12,20,{pair:'1',cue:'Choose one version, keep it consistent and calibrate its own load.'}],
    ['curl','Cable curl','stack lb',3,10,15,{pair:'1'}],
  ]},
  {code:'legs-a',label:'Legs A',title:'Legs A / Squat + quads',circuit:'squat',cue:'Allow 10–12 min preparation and 12–15 min squat. Kneeling curls are per side. Omit the final leg-press/calf set if needed; preserve curls and main rest.',exercises:[
    ['main','Back squat','total lb',3,4,6,{restSec:180}],
    ['legcurl','Atlantis kneeling leg curl','stack lb',3,10,15,{unilateral:true,restSec:90,cue:'Each listed set includes both sides; rest after both.'}],
    ['legpress','Fortis leg press','machine lb',2,10,15,{restSec:90,cue:'Controlled range; follow the marked loading convention. Do not convert from squat loads.'}],
    ['calf','Standing DB calf raise','per hand',3,12,20,{pair:'1',cue:'Stable floor; do not balance on loose plates.'}],
    ['abwheel','Ab wheel rollout','bodyweight',2,8,12,{kind:'core',pair:'1',cue:'Progress controlled reach only without losing position.'}],
  ]},
  {code:'push-b',label:'Push B',title:'Push B / Bench volume + shoulders',circuit:'push',cue:'Paused bench at 2–3 RIR. Required cable crunches finish the session; trim the final fly set if time is tight. Seated DB pressing and cable work provide bodybuilding volume. No assumed chest/shoulder press machines.',exercises:[
    ['main','Barbell bench press','total lb',3,6,8,{restSec:180,rir:'2–3',cue:'Calibrate a separate moderate load from Push A.'}],
    ['shoulder','Seated DB shoulder press','per hand',2,8,12,{restSec:90}],
    ['fly','Cable fly','stack lb',2,10,15,{cue:'Displayed load per stack; controlled comfortable range.'}],
    ['lateral','Cable lateral raise','stack lb',2,12,20,{unilateral:true,restSec:75,pair:'1'}],
    ['triceps','Overhead cable triceps extension','stack lb',2,10,15,{pair:'1'}],
    ['crunch','Kneeling cable crunch','stack lb',2,10,15,{kind:'core',rir:'2–3',cue:'After the main lifts. Controlled trunk flexion, no swinging; leave 2–3 clean reps in reserve. Pair with nearby triceps work if practical.'}],
  ]},
  {code:'pull-b',label:'Pull B',title:'Pull B / Cable + machine back',circuit:'pull',cue:'Back and biceps bodybuilding. Keep rows supported/seated; deadlift on Legs B. Use a compatible cable pulldown station and recalibrate if changing stacks.',exercises:[
    ['pulldown','Neutral-grip cable pulldown','stack lb',3,8,12,{restSec:90}],
    ['row','Chest-supported machine row / seated cable row','machine lb',3,8,12,{restSec:90,cue:'Choose one version and keep it consistent. Recalibrate after changing stations.'}],
    ['rear','Rear-delt machine / cable reverse fly','stack lb',2,12,20,{pair:'1'}],
    ['hammer','Rope hammer curl','stack lb',3,10,15,{pair:'1'}],
  ]},
  {code:'legs-b',label:'Legs B',title:'Legs B / Deadlift + belt squat',circuit:'deadlift',cue:'Deadlift strength, then belt squat/curl bodybuilding. Two deadlift work sets, no extra tops. Preserve 3 min rest; trim the final belt-squat/calf set before hamstrings.',exercises:[
    ['main','Conventional deadlift','total lb',2,3,5,{restSec:180}],
    ['belt','Wenning belt squat','added lb',3,8,12,{restSec:90,cue:'Ludus Magnus belt squat: plates added, calibrated on this machine.'}],
    ['legcurl','Atlantis kneeling leg curl','stack lb',3,10,15,{unilateral:true,restSec:90,cue:'Each listed set includes both sides. Keep setup consistent; log Legs B separately.'}],
    ['calf','Seated calf raise','added lb',3,12,15,{pair:'1'}],
    ['pallof','Pallof press','stack lb',2,10,10,{kind:'core',unilateral:true,pair:'1',cue:'Ten controlled reps per side; progress load without trunk rotation.'}],
  ]},
];
const variations = {
  'push-a': ['bench','Barbell bench press','Use the same grip and controlled touch each exposure.'],
  'push-b': ['paused-bench','1-second paused bench press','Pause motionless on the chest for one second without relaxing or sinking. Calibrate separately from regular bench.'],
};
export const PROGRAM = Array.from({length:60},(_,index) => {
  const t=templates[index%6],week=Math.floor(index/5)+1,block=Math.ceil(week/4),light=week%4===0;
  const variant=variations[t.code] || (t.code==='legs-a' ? (block===2
    ? ['ssb-box-squat','Safety-bar box squat','Use the Fortis SSB and a stable box/platform. Standardize bar weight and box height. Controlled contact, stay braced, no rocking or relaxing. Calibrate a fresh load.']
    : ['back-squat','Back squat','Use consistent stance and controlled depth; calibrate from current performance.']) : t.code==='legs-b' ? (block===2
    ? ['paused-deadlift','1-second paused conventional deadlift','Pause just clear of the floor for one second without losing position. Reset every rep. Calibrate separately from conventional deadlift.']
    : ['conventional-deadlift','Conventional deadlift','Start at normal floor height; reset each rep and keep clean reps in reserve.']) : null);
  const exercises=t.exercises.map(([id,name,unit,count,repMin,repMax,options={}]) => {
    const isMain=id==='main';
    return {id:`${t.code}-${id}${isMain?'-'+variant[0]:''}`,name:isMain?variant[1]:name,
      unit,kind:'lift',unilateral:false,restSec:60,pair:null,cue:'',...options,isMain,repMin,repMax,
      ...(isMain?{variation:variant[0],cue:variant[2]}:{}),
      sets:Array.from({length:light?(isMain?2:1):count},(_,i)=>({label:`Set ${i+1}`,
        weight:unit==='bodyweight'||options.kind==='pullup'?0:null,reps:repMin,distance:null,optional:false,
        rir:light?'4+':options.rir||'2'})),
    };
  });
  let warmup='Scaled Wenning-inspired circuit. '+circuits[t.circuit]+ ' Keep effort 3–4/10 and roughly 8+ RIR; never chase a burn. '+(!light&&['push','pull'].includes(t.circuit)?'A second round is optional only if readiness improves and time permits. ':'');
  warmup+='Then 3–4 non-fatiguing exercise-specific ramps. Total circuit plus ramps: 10–12 min. ';
  warmup+=variant ? `Ramp with today’s ${variant[1].toLowerCase()}: practise its exact bar, pause and setup before work sets. ` : 'Start pull-ups with easy assisted/bodyweight reps, or ramp the pulldown with light sets. ';
  if(t.code==='legs-b')warmup+='Use normal floor height, including paused deadlift ramps; no deficit is prescribed.';
  return {week,block,code:t.code,label:t.label,day:TRAINING_DAYS[index%5],order:index+1,
    exposure:Math.floor(index/6)+1,light,title:t.title,warmup,
    cue:(light?'Lighter week: 4+ RIR, one circuit round, fewer sets; continue the rotation. ':'')+t.cue,exercises};
});
