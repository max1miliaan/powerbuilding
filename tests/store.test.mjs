import test from 'node:test';
import assert from 'node:assert/strict';
import { FortisStore } from '../fortis-store.js';

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key,value) { this.values.set(key,String(value)); }
}
const deferred = () => { let resolve; const promise = new Promise(r => {resolve=r;}); return {promise,resolve}; };
const tick = () => new Promise(resolve => setTimeout(resolve,0));
const copy = value => structuredClone(value);

function fakeCloud() {
  const rows = new Map();
  let user = null, authCallback = () => {}, beforePush = null, beforePull = null, fail = false;
  const rowKey = (owner,id) => `${owner}|${id}`;
  const client = {
    auth: {
      onAuthStateChange(callback) { authCallback=callback; return {data:{subscription:{unsubscribe(){}}}}; },
      async getSession() { return {data:{session:user?{user}:null},error:null}; },
      async signInWithPassword({email}) { user={id:email,email};authCallback('SIGNED_IN',{user});return {data:{user},error:null}; },
      async signUp({email}) { return {data:{user:{id:email,email},session:null},error:null}; },
      async signOut() { user=null;authCallback('SIGNED_OUT',null);return {error:null}; },
    },
    from(table) {
      assert.equal(table,'fortis_records');let owner;
      return {
        select() { return this; },
        eq(column,value) { assert.equal(column,'user_id');owner=value;return this; },
        order() { return this; },
        async range(start,end) {
          const result=[...rows.entries()].filter(([key])=>key.startsWith(owner+'|'))
            .sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>({record_id:key.slice(owner.length+1),...copy(value)})).slice(start,end+1);
          if(beforePull) await beforePull();
          return fail?{data:null,error:new Error('Network failed')}:{data:result,error:null};
        }
      };
    },
    async rpc(name,args) {
      assert.equal(name,'fortis_put_record');
      const owner=user?.id;
      if(beforePush) await beforePush();
      if(fail) return {data:null,error:new Error('Network failed')};
      const key=rowKey(owner,args.p_record_id), row=rows.get(key);
      if((row?.revision||0)!==args.p_expected_revision) return {data:{ok:false,value:copy(row?.value??null),revision:row?.revision||0},error:null};
      const next={value:copy(args.p_value),revision:(row?.revision||0)+1};rows.set(key,next);
      return {data:{ok:true,revision:next.revision},error:null};
    }
  };
  return {client,rows,setUser(value){user=value;},emitAuth(value){user=value;authCallback(value?'SIGNED_IN':'SIGNED_OUT',value?{user:value}:null);},
    setBeforePush(fn){beforePush=fn;},setBeforePull(fn){beforePull=fn;},setFail(value){fail=value;},
    put(owner,id,value,revision=1){rows.set(rowKey(owner,id),{value:copy(value),revision});},
    get(owner,id){return rows.get(rowKey(owner,id));}};
}

function fixture(t,{cloud=fakeCloud(),storage=new MemoryStorage()}={}) {
  const store=new FortisStore({client:cloud.client,storage});
  t.after(()=>clearTimeout(store.timer));
  const use=(id)=>{const user=id?{id,email:id+'@example.com'}:null;cloud.setUser(user);store.switchUser(user);};
  const set=(id,value)=>{store.set(id,value);clearTimeout(store.timer);};
  return {store,cloud,storage,use,set};
}

test('local saves survive a new store and never touch the old tracker namespace',t=>{
  const storage=new MemoryStorage();storage.setItem('pb12wk_v12','legacy');
  const first=new FortisStore({storage});t.after(()=>clearTimeout(first.timer));
  first.set('1:A:bench:0',{weight:205,reps:5});
  const second=new FortisStore({storage});
  assert.deepEqual(second.get('1:A:bench:0'),{weight:205,reps:5});
  assert.equal(storage.getItem('pb12wk_v12'),'legacy');assert.equal(second.state.configured,false);
});

test('guest and signed-in accounts remain isolated and imports are explicit',async t=>{
  const {store,use,set,cloud}=fixture(t);
  set('set',{reps:5});use('alice');assert.deepEqual(store.all(),{});
  assert.equal(store.importGuest(),1);clearTimeout(store.timer);await store.sync();
  assert.equal(cloud.get('alice','set').value.reps,5);
  set('set',{reps:6});await store.sync();assert.equal(store.importGuest(),0);
  use('bob');assert.deepEqual(store.all(),{});use(null);assert.equal(store.get('set').reps,5);
  use('alice');assert.equal(store.get('set').reps,6);
});

test('guest import cannot overwrite a previously unseen cloud entry',async t=>{
  const {store,use,set,cloud}=fixture(t);set('set',{reps:5});cloud.put('alice','set',{reps:8},2);use('alice');
  store.importGuest();clearTimeout(store.timer);await store.sync();
  assert.equal(cloud.get('alice','set').value.reps,8);assert.equal(store.get('set').reps,5);assert.equal(store.state.conflicts,1);
});

test('different records merge; same-record conflicts preserve both versions',async t=>{
  const {store,use,set,cloud}=fixture(t);use('alice');set('one',{reps:5});await store.sync();
  cloud.put('alice','one',{reps:8},2);cloud.put('alice','two',{reps:12},1);
  set('one',{reps:4});await store.sync();
  assert.equal(store.get('two').reps,12);assert.deepEqual(store.conflicts,[{id:'one',local:{reps:4},remote:{reps:8}}]);
  assert.equal(cloud.get('alice','one').value.reps,8);
  store.resolveConflict('one','local');await store.sync();assert.equal(cloud.get('alice','one').value.reps,4);
  cloud.put('alice','one',{reps:9},4);set('one',{reps:6});await store.sync();
  store.resolveConflict('one','remote');await store.sync();assert.equal(store.get('one').reps,9);assert.equal(store.state.pending,0);
});

test('failed cloud requests retain the local queue and recover on retry',async t=>{
  const {store,use,set,cloud}=fixture(t);use('alice');cloud.setFail(true);set('set',{reps:5});await store.sync();
  assert.equal(store.state.pending,1);assert.equal(store.state.status,'error');assert.equal(store.get('set').reps,5);
  cloud.setFail(false);await store.sync();assert.equal(store.state.pending,0);assert.equal(cloud.get('alice','set').value.reps,5);
});

test('an edit during an in-flight write is retained and queued',async t=>{
  const {store,use,set,cloud}=fixture(t);use('alice');const entered=deferred(),gate=deferred();
  cloud.setBeforePush(async()=>{entered.resolve();await gate.promise;});set('set',{reps:5});const syncing=store.sync();
  await entered.promise;set('set',{reps:6});gate.resolve();await syncing;
  assert.equal(store.get('set').reps,6);assert.equal(store.state.pending,1);
  cloud.setBeforePush(null);await store.sync();assert.equal(cloud.get('alice','set').value.reps,6);assert.equal(store.state.pending,0);
});

test('a stale response after account switch cannot populate the new account',async t=>{
  const {store,use,cloud}=fixture(t);use('alice');cloud.put('alice','private',{reps:7});cloud.put('bob','other',{reps:9});
  const entered=deferred(),gate=deferred();cloud.setBeforePull(async()=>{entered.resolve();await gate.promise;});
  const old=store.sync();await entered.promise;use('bob');const next=store.sync();gate.resolve();await Promise.all([old,next]);
  assert.equal(store.get('private'),undefined);assert.equal(store.get('other').reps,9);
});

test('auth callbacks switch cache before notifying the UI and sign-out exposes only guest data',async t=>{
  const {store,cloud,set}=fixture(t);set('guest',{reps:3});await store.init();
  await store.signIn('alice','password');set('private',{reps:8});await store.sync();
  let sawNewAccount=false;store.addEventListener('change',()=>{if(store.state.user?.id==='bob'){sawNewAccount=true;assert.equal(store.get('private'),undefined);}});
  cloud.emitAuth({id:'bob',email:'bob@example.com'});await tick();await store.sync();assert.equal(sawNewAccount,true);
  await store.signOut();assert.equal(store.get('private'),undefined);assert.equal(store.get('guest').reps,3);await tick();
});

test('pagination retrieves more than Supabase’s default 1000-row cap',async t=>{
  const {store,use,cloud}=fixture(t);use('alice');for(let i=0;i<1201;i++)cloud.put('alice',`set-${String(i).padStart(4,'0')}`,{reps:i});
  await store.sync();assert.equal(Object.keys(store.all()).length,1201);assert.equal(store.get('set-1200').reps,1200);
});

test('storage quota failures are reported rather than labelled as saved',t=>{
  const {store,storage,set}=fixture(t);set('set',{reps:5});storage.setItem=()=>{throw new Error('QuotaExceeded');};
  assert.throws(()=>set('set',{reps:8}),/Not saved/);assert.equal(store.get('set').reps,5);assert.equal(store.state.status,'error');
});

test('storage failure during a cloud pull never claims data was saved locally',async t=>{
  const {store,storage,use,cloud}=fixture(t);use('alice');cloud.put('alice','new',{reps:5});
  storage.setItem=()=>{throw new Error('QuotaExceeded');};await store.sync();
  assert.match(store.state.error,/^Not saved:/);assert.equal(store.get('new'),undefined);
});
