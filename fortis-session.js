import { PROGRAM, PROGRAM_ID, buildProgram } from './fortis-program.js';

export const setupKey = (week, code) => `${PROGRAM_ID}:setup:${week}:${code}`;
export const prescriptionKey = (week, code) => `${PROGRAM_ID}:prescription:${week}:${code}`;

export function settingsFor(session) {
  return {
    light: session.light,
    variation: session.exercises.find(e => e.isMain)?.variation || '',
    quad: session.exercises.some(e => e.id.endsWith('-legextension')) ? 'leg-extension' : 'leg-press',
  };
}

export function programFromRecords(getRecord) {
  const settings = Object.fromEntries(PROGRAM.map(p => {
    const frozen = getRecord(prescriptionKey(p.week, p.code));
    return [`${p.week}:${p.code}`, frozen?.version === 1 ? frozen.settings : getRecord(setupKey(p.week, p.code)) || {}];
  }));
  return buildProgram(settings);
}

export function sessionStarted(records, session) {
  const {week, code} = session;
  return Object.keys(records).some(id =>
    id === prescriptionKey(week, code)
    || id.startsWith(`${PROGRAM_ID}:${week}:${code}:`)
    || id.startsWith(`${PROGRAM_ID}:adjust:${week}:${code}:`)
    || (id === `${PROGRAM_ID}:session:${week}:${code}` && records[id]?.finishedAt));
}

// A session's chosen prescription becomes immutable before its first target,
// performed entry, or completion. Later setup edits cannot relabel these logs.
export function freezePrescription(store, session) {
  const id = prescriptionKey(session.week, session.code);
  const saved = store.get(id);
  const current = settingsFor(programFromRecords(key => store.get(key)).find(p => p.week === session.week && p.code === session.code));
  if (JSON.stringify(current) !== JSON.stringify(settingsFor(session))) {
    throw new Error('This session’s setup changed on another device. Reload it before entering sets.');
  }
  if (!saved) store.set(id, {version: 1, settings: current});
}
