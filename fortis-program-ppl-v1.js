// Fortis Carlaw: new prescription, separate from the archived binder plan.
export const PROGRAM_ID = 'ppl-v1';
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
  'Warm-ups are scaled Wenning-inspired circuits, not the full high-volume protocol. Upper: two easy rounds; lower: start with one. Leave 5+ RIR without deliberate fatigue. Circuit plus lift-specific ramps should take 10–12 minutes total. Warm-up work is not hard bodybuilding volume.',
  'Rest 3 minutes between main-lift sets, 2–3 for pull-ups, 90 seconds for other compounds and rows, and 60–75 seconds for isolation work. Pair only nearby free accessory stations. Never shorten main-lift rest to add accessories.',
  'Keep the 60-minute cap. Kneeling curls and unilateral cable work need time for both sides. If behind, omit the final leg-press/belt-squat or calf set; on upper days trim the final isolation set. Preserve preparation, main rest and hamstring work. No required sled finisher.',
  'No plyometrics, RDLs or front squats. Use Fortis kneeling curls, supported rows, leg press, Wenning belt squat and cables. Do not assume seated curls, machine chest/shoulder presses or standing calf machines are available.',
  'Rear delts, side delts, calves and core are included. Squats, leg press, belt squats and deadlifts also train glutes. Coverage does not diagnose physical imbalance. Match unilateral reps and record the harder side’s RIR; do not automatically add weaker-side work.',
  'Use safeties or a spotter for bench and squat. Stop new pain. If several lifts decline over repeated exposures with poor recovery, take a lighter week and resume conservatively.',
  'Earlier Fortis logs remain available in History and in your export. They are not imported into the new PPL targets.',
];
const circuits = {
  push:'Two easy rounds: cable row × 15–20; rope pressdown × 15–20; light cable fly × 15.',
  pull:'Two easy rounds: light cable pulldown × 15–20; rear-delt row × 15–20; cable curl × 15.',
  squat:'Start with one easy round: light Atlantis kneeling leg curl × 12–15 per side; bodyweight squat × 10–15; dead bug × 5 per side.',
  deadlift:'Start with one easy round: light Atlantis kneeling leg curl × 12–15 per side; bodyweight glute bridge × 15; bird dog × 5 per side.',
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
  {code:'push-b',label:'Push B',title:'Push B / Bench volume + shoulders',circuit:'push',cue:'Moderate bench at 2–3 RIR. Seated DB pressing and cable work provide bodybuilding volume. No assumed chest/shoulder press machines.',exercises:[
    ['main','Barbell bench press','total lb',3,6,8,{restSec:180,rir:'2–3',cue:'Calibrate a separate moderate load from Push A.'}],
    ['shoulder','Seated DB shoulder press','per hand',2,8,12,{restSec:90}],
    ['fly','Cable fly','stack lb',2,10,15,{cue:'Displayed load per stack; controlled comfortable range.'}],
    ['lateral','Cable lateral raise','stack lb',3,12,20,{unilateral:true,restSec:75,pair:'1'}],
    ['triceps','Overhead cable triceps extension','stack lb',2,10,15,{pair:'1'}],
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
export const PROGRAM = Array.from({length:60},(_,index) => {
  const t=templates[index%6],week=Math.floor(index/5)+1,light=week%4===0;
  const exercises=t.exercises.map(([id,name,unit,count,repMin,repMax,options={}]) => ({
    id:`${t.code}-${id}`,name,unit,kind:'lift',unilateral:false,restSec:60,pair:null,cue:'',...options,repMin,repMax,
    sets:Array.from({length:light?(id==='main'?2:1):count},(_,i)=>({label:`Set ${i+1}`,
      weight:unit==='bodyweight'||options.kind==='pullup'?0:null,reps:repMin,distance:null,optional:false,
      rir:light?'4+':options.rir||'2'})),
  }));
  let warmup=circuits[t.circuit];
  if(light)warmup=warmup.replace('Two easy rounds:','One easy round:');
  warmup='Scaled Wenning-inspired circuit. '+warmup+' Keep 5+ RIR; stop short of fatigue. Then 3–4 exercise-specific ramp sets, starting light and approaching the working load without grinding. Total preparation: 10–12 min. Deadlift ramps use normal bar height.';
  return {week,block:Math.ceil(week/4),code:t.code,label:t.label,day:TRAINING_DAYS[index%5],order:index+1,
    exposure:Math.floor(index/6)+1,light,title:t.title,warmup,
    cue:(light?'Lighter week: 4+ RIR, one circuit round, fewer sets; continue the rotation. ':'')+t.cue,exercises};
});
