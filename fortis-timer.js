// An account/tab-scoped rest clock. Storage is optional; deadlines survive reloads.
const MAX_SECONDS = 24 * 60 * 60;
const cleanLabel = label => typeof label === 'string' && label.trim()
  ? label.trim().slice(0, 200) : 'Rest';

export function formatDuration(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export class RestTimer {
  constructor({storage = null, key = 'fortis-rest-v1:guest', now = Date.now} = {}) {
    this.storage = storage;
    this.key = key;
    this.now = now;
    this._end = null;
    this._paused = 0;
    this._label = '';
    this._context = '';
    this._completed = false;
    this.restore();
  }

  get remaining() {
    return this._end === null ? this._paused
      : Math.max(0, Math.ceil((this._end - this.now()) / 1000));
  }
  // An expired running clock remains running until tick() consumes its expiry.
  get running() { return this._end !== null; }
  get paused() { return this._end === null && this._paused > 0; }
  get label() { return this._label; }
  get context() { return this._context; }
  get completed() { return this._completed; }
  get state() { return {end: this._end, paused: this._paused, label: this._label, context: this._context, completed: this._completed}; }

  duration(seconds) {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)
      || seconds < 0 || seconds > MAX_SECONDS) {
      throw new RangeError('Rest duration must be between 0 and 86400 seconds.');
    }
    return Math.ceil(seconds);
  }

  start(seconds, label = 'Rest', context = '') {
    const duration = this.duration(seconds);
    if (!duration) { this.clear(); return; }
    this._end = this.now() + duration * 1000;
    this._paused = 0;
    this._label = cleanLabel(label);
    this._context = typeof context === 'string' ? context.slice(0, 200) : '';
    this._completed = false;
    this.persist();
  }

  toggle() {
    if (this.running) {
      // Leave an elapsed clock for tick(), so pausing cannot swallow the alert.
      const remaining = this.remaining;
      if (!remaining) return;
      this._paused = remaining;
      this._end = null;
      this.persist();
    } else if (this.paused) {
      this._end = this.now() + this._paused * 1000;
      this._paused = 0;
      this.persist();
    }
  }

  add(seconds = 30) {
    const additional = this.duration(seconds);
    if (!additional) return;
    const duration = Math.min(MAX_SECONDS, this.remaining + additional);
    if (this.running) this._end = this.now() + duration * 1000;
    else this._paused = duration; // Adding to idle prepares a paused clock.
    this._label ||= 'Rest';
    this._completed = false;
    this.persist();
  }

  clear() {
    this._end = null;
    this._paused = 0;
    this._label = '';
    this._context = '';
    this._completed = false;
    try { this.storage?.removeItem(this.key); } catch {}
  }

  tick() {
    if (!this.running || this._end > this.now()) return false;
    this._end = null;
    this._paused = 0;
    this._completed = true;
    this.persist();
    return true;
  }

  persist() {
    try { this.storage?.setItem(this.key, JSON.stringify({version: 1, ...this.state})); } catch {}
  }

  restore() {
    try {
      const raw = this.storage?.getItem(this.key);
      if (raw == null) return;
      const value = JSON.parse(raw);
      const valid = value !== null && typeof value === 'object' && !Array.isArray(value)
        && value.version === 1 && typeof value.label === 'string'
        && typeof value.context === 'string' && value.context.length <= 200
        && typeof value.completed === 'boolean'
        && value.label.trim().length > 0 && value.label.length <= 200
        && Number.isInteger(value.paused) && value.paused >= 0 && value.paused <= MAX_SECONDS
        && ((Number.isFinite(value.end) && value.end > 0
          && value.end <= this.now() + MAX_SECONDS * 1000 && value.paused === 0 && !value.completed)
          || (value.end === null && value.paused > 0 && !value.completed)
          || (value.end === null && value.paused === 0 && value.completed));
      if (!valid) { this.clear(); return; }
      this._end = value.end;
      this._paused = value.paused;
      this._label = value.label;
      this._context = value.context;
      this._completed = value.completed;
    } catch {
      this.clear();
    }
  }
}
