// Local-first records. Cloud sync is optional; legacy tracker storage is untouched.
const PREFIX = 'fortis-v1:';
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export class FortisStore extends EventTarget {
  constructor({url = '', key = '', storage, client = null} = {}) {
    super();
    let storageUnavailable = false;
    if (!storage) {
      try { storage = globalThis.localStorage; } catch { storageUnavailable = true; }
    }
    if (!storage) {
      storageUnavailable = true;
      storage = {length:0,key:()=>null,getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};
    }
    this.url = url; this.key = key; this.storage = storage; this.client = client;
    this.user = null; this.status = 'local'; this.error = ''; this.generation = 0;
    if (storageUnavailable) { this.status = 'error'; this.error = 'Browser storage is blocked. Entries cannot be saved in this browser.'; }
    this.running = null; this.timer = null;
    this.onStorage = event => { if (event.key?.startsWith(this.prefix)) this.emit(); };
    globalThis.addEventListener?.('storage', this.onStorage);
    globalThis.addEventListener?.('online', () => this.sync());
  }
  get prefix() { return `${PREFIX}${this.user?.id || 'guest'}:`; }
  get state() {
    const records = this.records();
    return {user: this.user ? {id: this.user.id, email: this.user.email} : null,
      configured: !!(this.client || (this.url && this.key)), status: this.status, error: this.error,
      pending: Object.values(records).filter(r => r.dirty).length,
      conflicts: Object.values(records).filter(r => r.conflict).length};
  }
  get conflicts() {
    return Object.entries(this.records()).filter(([,r]) => r.conflict)
      .map(([id,r]) => ({id, local: clone(r.value), remote: clone(r.conflict.value)}));
  }
  emit() { this.dispatchEvent(new Event('change')); }
  records(prefix = this.prefix) {
    const result = {};
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (!key?.startsWith(prefix)) continue;
        const record = JSON.parse(this.storage.getItem(key));
        if (record && typeof record.revision === 'number' && 'value' in record)
          result[decodeURIComponent(key.slice(prefix.length))] = record;
      }
    } catch { this.error = 'Browser storage could not be read. Export a backup before continuing.'; }
    return result;
  }
  read(id, prefix = this.prefix) {
    const text = this.storage.getItem(prefix + encodeURIComponent(id));
    return text ? JSON.parse(text) : null;
  }
  write(id, record, prefix = this.prefix) {
    try { this.storage.setItem(prefix + encodeURIComponent(id), JSON.stringify(record)); }
    catch {
      this.status = 'error'; this.error = 'Not saved: browser storage is unavailable or full. Export a backup.'; this.emit();
      const error = new Error(this.error); error.name = 'FortisStorageError'; throw error;
    }
  }
  get(id) { return clone(this.read(id)?.value); }
  all() { return Object.fromEntries(Object.entries(this.records()).map(([id,r]) => [id,clone(r.value)])); }
  set(id, value) {
    if (typeof id !== 'string' || !id.length || id.length > 200) throw new Error('Invalid record ID');
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Record value must be an object');
    const previous = this.read(id);
    const record = {value: clone(value), revision: previous?.revision || 0, dirty: true,
      changeId: globalThis.crypto.randomUUID(), conflict: previous?.conflict || null};
    this.write(id, record); this.error = ''; this.emit();
    clearTimeout(this.timer); this.timer = setTimeout(() => this.sync(), 650);
    return clone(value);
  }
  async init() {
    if (!this.state.configured) { this.emit(); return this; }
    try {
      if (!this.client) {
        const {createClient} = await import('./vendor/supabase.js');
        this.client = createClient(this.url, this.key, {auth: {storageKey: 'fortis-auth-v1', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true}});
      }
      // Keep Supabase auth callbacks synchronous; calling its methods inside can deadlock.
      this.client.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => { this.switchUser(session?.user || null); this.sync(); }, 0);
      });
      const {data, error} = await this.client.auth.getSession();
      if (error) throw error;
      this.switchUser(data.session?.user || null);
      await this.sync();
    } catch (error) { this.status = 'error'; this.error = `Sync unavailable: ${error.message}`; this.emit(); }
    return this;
  }
  switchUser(user) {
    if (this.user?.id !== user?.id) { this.generation++; this.user = user; this.error = ''; }
    else this.user = user;
    this.status = user ? 'ready' : 'local'; this.emit();
  }
  requireClient() { if (!this.client) throw new Error('Cloud sync is not configured yet. Your entries are saved on this device.'); }
  async signIn(email, password) {
    this.requireClient();
    const {data,error} = await this.client.auth.signInWithPassword({email,password});
    if (error) throw error;
    this.switchUser(data.user); await this.sync(); return data.user;
  }
  async signUp(email, password) {
    this.requireClient();
    const {data,error} = await this.client.auth.signUp({email,password});
    if (error) throw error;
    if (data.session) { this.switchUser(data.user); await this.sync(); }
    return {confirmationRequired: !data.session};
  }
  async signOut() {
    this.requireClient();
    const {error} = await this.client.auth.signOut({scope: 'local'});
    if (error) throw error;
    this.switchUser(null);
  }
  importGuest() {
    if (!this.user) throw new Error('Sign in before importing device entries.');
    let count = 0;
    for (const [id,record] of Object.entries(this.records(`${PREFIX}guest:`))) {
      // Existing account entries always win; never silently merge guest data into another person.
      if (!this.read(id)) { this.set(id,record.value); count++; }
    }
    this.sync(); return count;
  }
  exportData() { return {format:'fortis-v1', exportedAt:new Date().toISOString(), user:this.user?.id || 'guest', records:this.all(), conflicts:this.conflicts}; }
  resolveConflict(id, choice) {
    const record = this.read(id);
    if (!record?.conflict) return;
    if (!['local','remote'].includes(choice)) throw new Error('Choose local or remote');
    const remote = record.conflict;
    this.write(id, {value: choice === 'remote' ? remote.value : record.value, revision: remote.revision,
      dirty: choice === 'local', conflict: null, changeId: globalThis.crypto.randomUUID()});
    this.emit(); this.sync();
  }
  async sync() {
    if (!this.client || !this.user) return;
    if (this.running) {
      await this.running;
      // A user switch cancels applying the old response; the new account still needs a pull.
      if (this.status === 'ready' || (this.state.pending && !this.state.conflicts && this.status === 'synced')) return this.sync();
      return;
    }
    if (globalThis.navigator?.onLine === false) { this.status = 'offline'; this.emit(); return; }
    const generation = this.generation, prefix = this.prefix, userId = this.user.id;
    const active = () => this.generation === generation;
    this.status = 'syncing'; this.error = ''; this.emit();
    this.running = (async () => {
      try {
        // Page the full result; Supabase's default row cap must not truncate later weeks.
        for (let start = 0; ; start += 500) {
          const {data,error} = await this.client.from('fortis_records').select('record_id,value,revision')
            .eq('user_id',userId).order('record_id').range(start,start+499);
          if (error) throw error;
          if (!active()) return;
          for (const remote of data) {
            const local = this.read(remote.record_id,prefix);
            if (!local?.dirty || same(local.value,remote.value)) {
              this.write(remote.record_id,{value:remote.value,revision:remote.revision,dirty:false,conflict:null},prefix);
            } else if (local.revision !== remote.revision) {
              this.write(remote.record_id,{...local,conflict:{value:remote.value,revision:remote.revision}},prefix);
            }
          }
          if (data.length < 500) break;
        }
        for (const [id,snapshot] of Object.entries(this.records(prefix))) {
          if (!active()) return;
          if (!snapshot.dirty || snapshot.conflict) continue;
          const {data,error} = await this.client.rpc('fortis_put_record', {
            p_record_id:id, p_value:snapshot.value, p_expected_revision:snapshot.revision});
          if (error) throw error;
          if (!active()) return;
          const current = this.read(id,prefix);
          if (data.ok) {
            this.write(id,{...current,revision:data.revision,
              dirty:current.changeId !== snapshot.changeId,conflict:null},prefix);
          } else {
            this.write(id,{...current,conflict:{value:data.value,revision:data.revision}},prefix);
          }
        }
        if (active()) this.status = this.conflicts.length ? 'conflict' : 'synced';
      } catch (error) {
        if (active()) {
          this.status = 'error';
          this.error = error.name === 'FortisStorageError' ? error.message : `Saved on this device; cloud sync failed: ${error.message}`;
        }
      } finally { if (active()) this.emit(); }
    })();
    try { await this.running; } finally { this.running = null; }
  }
}
