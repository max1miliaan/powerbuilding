import { RestTimer, formatDuration } from './fortis-timer.js';
import { estimateFor, progressionFor } from './fortis-loads.js';
import { PROGRAM, GUIDANCE, PROGRAM_ID } from './fortis-program.js';
import { PROGRAM as PPL_V1_PROGRAM } from './fortis-program-ppl-v1.js';
import { PROGRAM as LEGACY_PROGRAM } from './fortis-program-legacy.js';
import { FortisStore } from './fortis-store.js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './fortis-config.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = new FortisStore({url:SUPABASE_URL,key:SUPABASE_PUBLISHABLE_KEY});
let week=1, code=PROGRAM[0].code, toastTimeout, currentPanel='';
try { const saved=JSON.parse(localStorage.getItem('fortis-ppl-view-v2')||'null'); if(saved && PROGRAM.some(p=>p.week===saved.week&&p.code===saved.code)){week=saved.week;code=saved.code;} } catch {}
let timerStorage;try{timerStorage=sessionStorage;}catch{}
const accountTimer=uid=>new RestTimer({storage:timerStorage,key:`fortis-rest-v1:${uid||'guest'}`});
let restTimer=accountTimer(null);
const session = () => PROGRAM.find(p=>p.week===week&&p.code===code);
const key = (e,i,w=week,c=code) => `${PROGRAM_ID}:${w}:${c}:${e.id}:${i}`;
const metaKey = () => `${PROGRAM_ID}:session:${week}:${code}`;
const adjustment = e => store.get(`${PROGRAM_ID}:adjust:${week}:${code}:${e.id}`)||{};
const actualFields = e => e.kind==='sled'||e.kind==='carry' ? ['weight','distance','effort'] : e.kind==='jump' ? ['reps',...(e.name.toLowerCase().includes('broad')?['bestCm']:[])] : [...(e.unit!=='bodyweight'?['weight']:[]),...(e.unilateral?['left','right']:['reps']), 'rir'];
const names={weight:'lb',reps:'Reps',left:'Left reps',right:'Right reps',rir:'RIR',distance:'Metres',effort:'Effort / 10',bestCm:'Best cm'};
const targetWeight = (e,s) => {
  if(e.unit==='bodyweight')return 0;
  const load=adjustment(e).load;
  return load!==null&&load!==undefined&&load!=='' ? Number(load) : s.weight;
};
const targetReps = (e,s) => adjustment(e).reps ?? s.reps;
function target(e,s){
  const load=targetWeight(e,s), override=adjustment(e).reps;
  const reps=override??(e.repMin===e.repMax?e.repMin:`${e.repMin}–${e.repMax}`);
  const w=e.unit==='bodyweight'?'BW':load===null?'Choose load':e.kind==='pullup'?(load===0?'BW':load>0?`BW + ${load} lb`:`${Math.abs(load)} lb assistance`):`${load} lb`;
  return `${adjustment(e).loadSource==='estimate'?'Est. ':''}${w} × ${reps}${e.unilateral?' / side':''}`;
}
function placeholder(e,s,f){return f==='weight'?(targetWeight(e,s)??estimateFor(e,{light:session().light}).value??''):f==='reps'||f==='left'||f==='right'?targetReps(e,s):'';}
function loadGuidance(e){
  const p=progressionFor({program:PROGRAM,session:session(),exercise:e,getRecord:id=>store.get(id)});
  const estimate=estimateFor(e,{light:session().light});
  const unchosen=adjustment(e).load==null;
  return `<div class="load-guidance"><p><strong>Progression:</strong> ${esc(p.text)}</p>${unchosen&&p.kind==='calibrate'?`<p><strong>Estimated first trial:</strong> ${esc(estimate.label)}. ${esc(estimate.basis)}</p>${estimate.value!==null&&e.unit!=='bodyweight'?'<button data-estimate="'+esc(e.id)+'">Set estimated target</button>':''}`:''}${unchosen&&p.load!==null&&!session().light?`<button data-previous="${esc(e.id)}">Use previous load as target</button>`:''}<p class="muted">Confirm the same equipment, setup and loading convention before comparing. Actual fields stay separate from targets.</p></div>`;
}
function adjustmentHTML(e){
  const a=adjustment(e),fields=[];
  if(e.unit!=='bodyweight')fields.push(['load','Working load (lb)',a.load??'']);
  fields.push(['reps','Reps target',a.reps??'']);
  return `<details class="adjust"><summary>Set this session’s targets</summary><p>Choose your working load after calibration. This changes only this session. Blank reps use the low end of the range for “Use target”. Progress manually after successful performed exposures.</p><div class="fields">${fields.map(([k,label,v])=>`<label class="field"><span>${label}</span><input aria-label="${esc(e.name)} ${label}" type="number" step="${k==='reps'?'1':'.5'}" min="${k==='load'&&e.kind==='pullup'?'-500':k==='reps'?'1':'0'}" data-adjust="${k}" value="${esc(v)}"></label>`).join('')}</div></details>`;
}
function notify(msg){$('#toast').textContent=msg;$('#toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').hidden=true,4500);}
function persistView(){try{localStorage.setItem('fortis-ppl-view-v2',JSON.stringify({week,code}));}catch{}}
function openPanel(title,html,type){currentPanel=type;$('#panel-title').textContent=title;$('#panel-body').innerHTML=html;if(!$('#panel').open)$('#panel').showModal();}
function lastPerformance(e){for(let w=week-1;w>=1;w--){const p=PROGRAM.find(p=>p.week===w&&p.code===code);const ex=p?.exercises.find(x=>x.id===e.id);if(!ex)continue;const logs=ex.sets.map((s,i)=>store.get(key(e,i,w))).filter(r=>r?.done);if(logs.length)return `Week ${w}: `+logs.map(r=>`${r.weight!=null?r.weight+' lb × ':''}${r.left!=null?r.left+'/'+r.right:r.distance!=null?r.distance+' m':r.reps}${r.rir!=null?' @ '+r.rir+' RIR':''}`).join(' · ');}return '';}
function render(){
  const p=session();persistView();$('#week').innerHTML=Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i+1===week?'selected':''}>${i+1}</option>`).join('');
  $('#days').innerHTML=PROGRAM.filter(x=>x.week===week).map(x=>`<button data-day="${x.code}" class="${x.code===code?'active':''}" aria-pressed="${x.code===code}" aria-label="${x.day}: ${x.label}"><small>${x.day}</small>${x.label}</button>`).join('');
  const finished=store.get(metaKey())?.finishedAt;
  $('#workout').innerHTML=`<div class="session-head"><div><p class="eyebrow">SESSION ${p.order} / BLOCK ${p.block}</p><h2>${esc(p.title)}</h2><p>${p.day} · ${p.light?'Lighter week · 4+ reps in reserve':'Exposure '+p.exposure+' · continue the rolling PPL sequence.'}</p></div><span class="session-meta">${finished?'COMPLETED':p.light?'LIGHTER WEEK':'60 MIN CAP'}</span></div>
    <div class="callout">${esc(p.cue)}</div><p class="muted progression-note">Choose loads from current performance. No automatic weight increases. <a href="https://github.com/max1miliaan/powerbuilding/blob/main/PPL_PROGRAM.md">Full plan</a></p><details class="warmup" open><summary>Warm-up & session instructions</summary><p>${esc(p.warmup)}</p><p>Warm-up sets do not count as work sets. Pair matching groups only when stations are nearby and free. RIR means clean reps left.</p></details>
    ${p.exercises.map((e,ei)=>`<article class="exercise" data-ex="${esc(e.id)}"><div class="exercise-head"><div><div class="exercise-number">${String(ei+1).padStart(2,'0')}${e.pair?' / PAIR '+esc(e.pair):''}</div><h3>${esc(e.name)}</h3><p>${esc(e.unit)}${e.unilateral?' · each side; harder-side RIR':''}${e.cue?' · '+esc(e.cue):''}</p></div><button class="rest-chip" data-rest="${e.restSec}">${formatDuration(e.restSec)} ${e.pair?'pair rest':e.unilateral?'after both sides':'rest'}</button></div>
      ${loadGuidance(e)}
      ${e.sets.map((s,i)=>{const r=store.get(key(e,i))||{};return `<div class="set-row ${r.done?'done':''}" data-index="${i}"><div class="set-target"><span class="set-label">${esc(s.label)}${s.optional?' · optional':''}</span><strong>${esc(target(e,s))}${s.rir?' · '+esc(s.rir)+' RIR':''}</strong><button class="fill-target" data-fill="${i}">Use target</button></div><div class="fields">${actualFields(e).map(f=>`<label class="field"><span>${names[f]}</span><input type="number" inputmode="decimal" step="${['reps','left','right'].includes(f)?'1':'.5'}" min="${f==='weight'&&e.kind==='pullup'?'-500':'0'}" max="${f==='rir'||f==='effort'?'10':f==='weight'?'2000':'999'}" aria-label="${esc(e.name)} ${esc(s.label)} actual ${names[f]}" data-field="${f}" value="${esc(r[f]??'')}" placeholder="${esc(placeholder(e,s,f))}"></label>`).join('')}</div><button class="done-button" aria-pressed="${!!r.done}" aria-label="${r.done?'Unmark':'Complete'} ${esc(e.name)} ${esc(s.label)}" data-done="${i}">${r.done?'✓':'○'}</button></div>`;}).join('')}
      ${lastPerformance(e)?`<p class="last-performance">LAST · ${esc(lastPerformance(e))}</p>`:''}
      ${!['jump','sled','carry'].includes(e.kind)?adjustmentHTML(e):''}</article>`).join('')}`;
  updateStatus();
}
function counts(){let total=0,done=0,extra=0;session().exercises.forEach(e=>e.sets.forEach((s,i)=>{if(!s.optional){total++;if(store.get(key(e,i))?.done)done++;}else if(store.get(key(e,i))?.done)extra++;}));return{total,done,extra};}
function updateStatus(){const n=counts();$('#set-count').textContent=`${n.done} / ${n.total} sets${n.extra?' + '+n.extra+' extra':''}`;const st=store.state;const message=st.error?`Not synced: ${st.error}`:st.conflicts?'Sync needs review':st.user&&st.pending?`${st.pending} changes waiting to sync`:st.user?(st.status==='syncing'?'Syncing…':!navigator.onLine?'Offline · saved on this device':'Synced'):st.configured?'Saved on this device · sign in to sync':'Saved on this device · cloud not connected';$('#save-status').textContent=message;$('#bar-status').textContent=st.error?'Check Account & sync':store.get(metaKey())?.finishedAt?'Session completed':'Entries save as you type';$('#finish-button').textContent=store.get(metaKey())?.finishedAt?'Next session':'Finish session';}
function saveSet(input){const article=input.closest('[data-ex]');const row=input.closest('[data-index]');if(!article||!row)return;const e=session().exercises.find(e=>e.id===article.dataset.ex);const id=key(e,Number(row.dataset.index));if(!input.validity.valid)return;const value=input.value===''?null:Number(input.value);store.set(id,{...(store.get(id)||{}),[input.dataset.field]:value,done:false});row.classList.remove('done');row.querySelector('[data-done]').setAttribute('aria-pressed','false');row.querySelector('[data-done]').textContent='○';invalidateFinish();}
function invalidateFinish(){if(store.get(metaKey())?.finishedAt)store.set(metaKey(),{finishedAt:null});}
function completeSet(button){const a=button.closest('[data-ex]'),e=session().exercises.find(x=>x.id===a.dataset.ex),i=Number(button.dataset.done),s=e.sets[i],id=key(e,i),r=store.get(id)||{};if(r.done){store.set(id,{...r,done:false});invalidateFinish();render();return;}const next={...r};for(const input of button.closest('.set-row').querySelectorAll('input')){if(!input.validity.valid){input.reportValidity();return;}const f=input.dataset.field;next[f]=input.value===''?null:Number(input.value);}
  const required=actualFields(e).filter(f=>!['bestCm','rir','effort'].includes(f));if(required.some(f=>next[f]===null||next[f]===undefined)){notify('Enter your actual weight and reps or distance before marking the set.');return;}
  store.set(id,{...next,done:true,performedAt:new Date().toISOString()});render();
}
function finish(){const p=session();if(store.get(metaKey())?.finishedAt){let ix=PROGRAM.findIndex(x=>x.week===week&&x.code===code);let next=PROGRAM[ix+1];if(next){week=next.week;code=next.code;render();window.scrollTo(0,0);}else notify('You’ve reached the end of the 12-week program.');return;}const n=counts();if(n.done<n.total){openPanel('Finish this session?',`<p>You completed ${n.done} of ${n.total} required sets. Unchecked sets will remain uncompleted.</p><div class="button-row"><button class="primary" id="finish-skipped">Finish with skipped sets</button><button id="continue-session">Keep training</button></div>`,'finish');return;}markFinished();}
function markFinished(){if(restTimer.context===`${week}:${code}`)restTimer.clear();store.set(metaKey(),{finishedAt:new Date().toISOString(),completed:counts().done,required:counts().total});$('#panel').close();render();notify('Session saved. Good work.');}
const legacyKey=(p,e,i,prefix='')=>`${prefix?prefix+':':''}${p.week}:${p.code}:${e.id}:${i}`;
function history(){
  const rows=PROGRAM.map(p=>{let done=0;for(const e of p.exercises)for(let i=0;i<e.sets.length;i++)if(store.get(key(e,i,p.week,p.code))?.done)done++;return{p,done,meta:store.get(`${PROGRAM_ID}:session:${p.week}:${p.code}`)};}).filter(x=>x.done||x.meta?.finishedAt);
  const old=[{program:LEGACY_PROGRAM,prefix:''},{program:PPL_V1_PROGRAM,prefix:'ppl-v1'}].flatMap(({program,prefix})=>program.map(p=>{const done=p.exercises.reduce((n,e)=>n+e.sets.filter((_,i)=>store.get(legacyKey(p,e,i,prefix))?.done).length,0);const saved=p.exercises.some(e=>e.sets.some((_,i)=>!!store.get(legacyKey(p,e,i,prefix))));return {p,prefix,done,saved,meta:store.get(`${prefix?prefix+':':''}session:${p.week}:${p.code}`)};}).filter(x=>x.saved||x.meta?.finishedAt));
  openPanel('Your training history',`<h3>Push / Pull / Legs</h3>${rows.length?rows.map(({p,done,meta})=>`<div class="history-row"><div><strong>Week ${p.week} · ${esc(p.label)}</strong><br/><small>${done} sets${meta?.finishedAt?' · finished':''}</small></div><button data-history="${p.week}:${p.code}">Open</button></div>`).join(''):'<p class="muted">No completed PPL sets yet.</p>'}<h3>Previous programs</h3><p class="muted">Read-only records from the earlier program. Entries remain in your export.</p>${old.length?old.map(({p,prefix,done})=>`<div class="history-row"><div><strong>Week ${p.week} · ${esc(p.title)}</strong><br/><small>${done} completed sets</small></div><button data-legacy="${prefix?prefix+'|':''}${p.week}:${p.code}">View</button></div>`).join(''):'<p class="muted">No earlier records on this account or device.</p>'}`,'history');
}
function legacyHistory(value){
  const [prefix,ref]=value.includes('|')?value.split('|'):['',value];
  const [w,c]=ref.split(':'),p=(prefix==='ppl-v1'?PPL_V1_PROGRAM:LEGACY_PROGRAM).find(p=>p.week===Number(w)&&p.code===c);if(!p)return;
  const entries=p.exercises.map(e=>{const logs=e.sets.map((s,i)=>({s,r:store.get(legacyKey(p,e,i,prefix))})).filter(x=>x.r);return logs.length?`<h3>${esc(e.name)}</h3>${logs.map(({s,r})=>`<p>${esc(s.label)} · ${esc([r.weight!=null?r.weight+' lb':null,r.left!=null?`${r.left}/${r.right??'—'} reps`:r.distance!=null?r.distance+' m':r.reps!=null?r.reps+' reps':null,r.rir!=null?r.rir+' RIR':null,r.bestCm!=null?'Best '+r.bestCm+' cm':null,r.effort!=null?'Effort '+r.effort+'/10':null,r.done?'Completed':'Unfinished'].filter(Boolean).join(' · '))}</p>`).join('')}`:'';}).join('');
  openPanel(`Previous plan · Week ${p.week} / ${p.code}`,`<p>Read-only · ${esc(p.title)}. These records retain their original exercise prescriptions.</p>${entries||'<p>No recorded sets.</p>'}<button id="back-history">Back to history</button>`,'legacy');
}
function guide(){openPanel('The PPL program',`<p>Five training days per week for 12 weeks. Continue Push A → Pull A → Legs A → Push B → Pull B → Legs B across Mondays. Weeks 4, 8 and 12 are lighter.</p><p>Compound strength lifts plus machine/cable bodybuilding. <a href="https://github.com/max1miliaan/powerbuilding/blob/main/PPL_PROGRAM.md">Read the full plan</a>.</p><ul class="guide-list">${GUIDANCE.map(g=>`<li>${esc(g)}</li>`).join('')}</ul>`,'guide');}
function account(){const s=store.state;const conflicts=store.conflicts||[];openPanel('Account & sync',`<p>${s.configured?'Sign in to keep the same log across your devices.':'Cloud sync is not connected yet. Your entries are saved in this browser. Export a backup before clearing browser data.'}</p><p role="status" class="${s.error?'warning':'muted'}">${esc(s.error||s.status||'Local mode')}${s.pending?' · '+s.pending+' pending':''}</p>
  ${s.configured&&!s.user?`<form id="auth-form"><label class="field"><span>Email</span><input id="email" type="email" autocomplete="email" required></label><label class="field"><span>Password</span><input id="password" type="password" autocomplete="current-password" minlength="8" required></label><div class="button-row"><button class="primary" type="submit">Sign in</button><button type="button" id="signup">Create account</button></div><p id="auth-message" role="status"></p></form>`:''}
  ${s.user?`<p>Signed in as <strong>${esc(s.user.email)}</strong></p><div class="button-row"><button id="sync-now">Sync now</button><button id="import-guest">Import this device’s guest log</button><button id="signout">Sign out</button></div><p class="muted">Signing out keeps unsynced entries saved under this account on this device. Sign back in to sync them.</p>`:''}
  ${conflicts.length?`<h3>Resolve simultaneous edits</h3><p>Both devices changed the same record. Choose which version to keep.</p>${conflicts.map(c=>`<div class="conflict"><strong>${esc(c.id)}</strong><p>This device</p><pre>${esc(JSON.stringify(c.local,null,2))}</pre><p>Cloud</p><pre>${esc(JSON.stringify(c.remote,null,2))}</pre><button data-conflict="${esc(c.id)}" data-choice="local">Keep this device</button> <button data-conflict="${esc(c.id)}" data-choice="remote">Keep cloud</button></div>`).join('')}`:''}
  <hr/><h3>Backup</h3><p class="muted">Download a private copy of the current log. No workout entries are stored in GitHub.</p><button id="export">Export log</button>`,'account');}
function timer(){openPanel('Rest timer',`<p id="timer-context">${esc(restTimer.label||'Choose a rest duration')}</p><div class="timer-number" id="timer-number">${timerText()}</div><p id="timer-status" role="status"></p><div class="button-row">${[60,75,90,120,150,180,240,300].map(n=>`<button data-timer="${n}">${n===90?'90 sec':formatDuration(n)}</button>`).join('')}</div><label class="field"><span>Custom rest (seconds)</span><input id="timer-seconds" type="number" required min="15" max="900" step="1" value="${restTimer.remaining||90}"></label><button id="timer-custom">Start custom rest</button><div class="button-row"><button id="timer-pause">Pause / resume</button><button id="timer-add">+30 sec</button><button id="timer-clear">Clear</button></div><p class="muted">For pairs, start one rest after both exercises and both sides. Timers survive reload in this tab. The countdown uses elapsed time; background alerts are not guaranteed.</p>`,'timer');updateTimer();}
function timerText(){return formatDuration(restTimer.remaining);}
function updateTimer(){
  if(restTimer.tick())notify('Rest complete');
  $('#rest-button').textContent=restTimer.completed?'Rest complete':restTimer.running||restTimer.paused?timerText()+(restTimer.paused?' paused':' rest'):'Rest timer';
  if($('#timer-number'))$('#timer-number').textContent=timerText();
  if($('#timer-context'))$('#timer-context').textContent=restTimer.label||'Choose a rest duration';
  if($('#timer-status'))$('#timer-status').textContent=restTimer.completed?'Rest complete':restTimer.paused?'Paused':restTimer.running?'Running':'Ready';
  if($('#timer-pause'))$('#timer-pause').textContent=restTimer.running?'Pause':restTimer.paused?'Resume':'Pause / resume';
}
function startTimer(sec,label='Manual rest',context=`${week}:${code}`){restTimer.start(Number(sec),label,context);updateTimer();notify(`${formatDuration(Number(sec))} rest started`);}
function exportLog(){const blob=new Blob([JSON.stringify(store.exportData(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`fortis-log-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function auth(signup=false){const form=$('#auth-form');if(!form.reportValidity())return;const email=$('#email').value,password=$('#password').value;const btns=[...form.querySelectorAll('button')];btns.forEach(b=>b.disabled=true);try{const result=signup?await store.signUp(email,password):await store.signIn(email,password);if(result?.confirmationRequired){$('#auth-message').textContent='Check your email to confirm your account, then sign in.';$('#password').value='';}else{render();account();}}catch(e){$('#auth-message').textContent=e.message;}finally{btns.forEach(b=>b.disabled=false);}}
document.addEventListener('input',ev=>{try{if(ev.target.matches('[data-field]'))saveSet(ev.target);}catch(e){notify(`Could not save: ${e.message}`);}});
document.addEventListener('change',ev=>{try{if(ev.target.id==='week'){week=Number(ev.target.value);if(!PROGRAM.some(p=>p.week===week&&p.code===code))code=PROGRAM.find(p=>p.week===week).code;render();}if(ev.target.matches('[data-adjust]')){const val=ev.target.value===''?null:Number(ev.target.value),isRep=ev.target.dataset.adjust.toLowerCase().includes('reps');if(val!==null&&(!Number.isFinite(val)||Math.abs(val)>2000||!ev.target.validity.valid||(isRep&&(!Number.isInteger(val)||val<1)))){notify('Use a valid load, or a positive whole-number rep target.');return;}const e=session().exercises.find(e=>e.id===ev.target.closest('[data-ex]').dataset.ex);store.set(`${PROGRAM_ID}:adjust:${week}:${code}:${e.id}`,{...adjustment(e),[ev.target.dataset.adjust]:val,...(ev.target.dataset.adjust==='load'?{loadSource:'manual'}:{})});render();}}catch(e){notify(e.message);}});
document.addEventListener('focusin',ev=>{if(ev.target.matches('input[type=number]'))ev.target.select();});
document.addEventListener('submit',ev=>{if(ev.target.id==='auth-form'){ev.preventDefault();auth();}});
document.addEventListener('click',async ev=>{const b=ev.target.closest('button');if(!b)return;try{
  if(b.dataset.day){code=b.dataset.day;render();}
  else if(b.dataset.done!==undefined)completeSet(b);
  else if(b.dataset.fill!==undefined){const e=session().exercises.find(e=>e.id===b.closest('[data-ex]').dataset.ex),i=Number(b.dataset.fill),s=e.sets[i],id=key(e,i),r={...(store.get(id)||{}),done:false};if(targetWeight(e,s)===null){notify('Choose a working load in this session’s targets before using target.');return;}for(const f of actualFields(e))if(!['rir','effort','bestCm'].includes(f))r[f]=placeholder(e,s,f);store.set(id,r);invalidateFinish();render();}
  else if(b.dataset.rest){const e=session().exercises.find(e=>e.id===b.closest('[data-ex]').dataset.ex);startTimer(Number(b.dataset.rest),`${session().label} · ${e.pair?'Pair '+e.pair:e.name}${e.unilateral?' · after both sides':''}`);}
  else if(b.dataset.estimate||b.dataset.previous){const id=b.dataset.estimate||b.dataset.previous,e=session().exercises.find(e=>e.id===id);const load=b.dataset.estimate?estimateFor(e,{light:session().light}).value:progressionFor({program:PROGRAM,session:session(),exercise:e,getRecord:id=>store.get(id)}).load;if(load===null)return;store.set(`${PROGRAM_ID}:adjust:${week}:${code}:${e.id}`,{...adjustment(e),load,loadSource:b.dataset.estimate?'estimate':'previous'});render();notify('Target set. Calibrate during ramps; actual sets are still entered separately.');}
  else if(b.dataset.timer){startTimer(Number(b.dataset.timer));}
  else if(b.dataset.legacy){legacyHistory(b.dataset.legacy);}
  else if(b.id==='back-history'){history();}
  else if(b.dataset.history){[week,code]=b.dataset.history.split(':');week=Number(week);$('#panel').close();render();window.scrollTo(0,0);}
  else if(b.dataset.conflict){await store.resolveConflict(b.dataset.conflict,b.dataset.choice);account();render();}
  else switch(b.id){
    case 'account-button':account();break;case 'history-button':history();break;case 'guide-button':guide();break;case 'close-panel':$('#panel').close();break;
    case 'rest-button':timer();break;case 'finish-button':finish();break;case 'finish-skipped':markFinished();break;case 'continue-session':$('#panel').close();break;
    case 'signup':await auth(true);break;case 'signout':await store.signOut();render();account();break;case 'sync-now':await store.sync();render();account();break;
    case 'import-guest':await store.importGuest();render();account();break;case 'export':exportLog();break;
    case 'timer-pause':restTimer.toggle();updateTimer();break;
    case 'timer-add':if(!restTimer.running&&!restTimer.paused){restTimer.start(30,'Manual rest',`${week}:${code}`);restTimer.toggle();}else restTimer.add(30);updateTimer();break;case 'timer-clear':restTimer.clear();updateTimer();break;
    case 'timer-custom':{const input=$('#timer-seconds'),seconds=Number(input.value);if(input.reportValidity()&&Number.isFinite(seconds)&&seconds>=15&&seconds<=900)startTimer(seconds);break;}
  }
}catch(e){notify(e.message||'Unable to save. Try again.');updateStatus();}});
let previousUser=null, previousStatus='', refreshPending=false;
function refreshFromCloud(){if(document.activeElement.matches('input'))refreshPending=true;else render();}
store.addEventListener('change',()=>{const s=store.state,uid=s.user?.id||null;if(uid!==previousUser){previousUser=uid;restTimer=accountTimer(uid);updateTimer();$('#panel').close();render();}else if(previousStatus==='syncing'&&s.status!=='syncing')refreshFromCloud();previousStatus=s.status;updateStatus();});
window.addEventListener('storage',ev=>{if(ev.key?.startsWith('fortis-v1:'))refreshFromCloud();});
document.addEventListener('focusout',()=>{if(refreshPending)setTimeout(()=>{if(!document.activeElement.matches('input')){refreshPending=false;render();}},0);});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){updateTimer();}if(document.visibilityState==='visible')store.sync().then(()=>{if(!document.activeElement.matches('input'))render();}).catch(e=>notify(e.message));});
window.addEventListener('online',()=>store.sync().then(()=>render()).catch(e=>notify(e.message)));
setInterval(updateTimer,250);
setInterval(()=>{if(document.visibilityState==='visible'&&store.state.user)store.sync().then(()=>{if(!document.activeElement.matches('input')&&!$('#panel').open)render();}).catch(()=>{});},30000);
try{await store.init();render();}catch(e){render();notify(`Storage unavailable: ${e.message}. Entries may not persist.`);}
