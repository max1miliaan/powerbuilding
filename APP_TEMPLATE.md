# Workout Tracker -- App Template / Framework Reference

Use this doc when building a new program into the HTML tracker. The scaffolding (CSS, timer, PR system, localStorage, rendering pipeline) stays the same -- only the data sections get swapped.

---

## Architecture Overview

Single-file HTML app: `<style>` + `<body>` with `#app` div + `<script>` IIFE.

```
powerbuilding.html
├── <style>        ~330 lines  (DO NOT REWRITE -- reuse as-is)
├── <body>
│   ├── #app       (render target -- innerHTML replaced on every render())
│   └── #timerBar  (lives OUTSIDE #app so render() doesn't destroy it)
└── <script>       ~580 lines
    ├── DATA LAYER          ← CHANGE THESE
    │   ├── WEEKS[]
    │   ├── DAY_LABELS[]
    │   ├── ALTS{}
    │   └── getExercises()
    ├── CONFIG
    │   ├── STORAGE_KEY
    │   └── defaultState()
    ├── UTILITIES            ← reuse
    │   ├── round25(), plates(), lk(), getLog(), isDl()
    │   ├── swapKey(), getDisplayName()
    │   └── computePRs()
    ├── TIMER SYSTEM         ← reuse (no program-specific logic)
    ├── RENDER               ← minimal edits (header title, rest-info map, notes content, settings modal fields)
    └── EVENT HANDLERS       ← reuse
```

---

## Data Sections to Replace

### 1. `WEEKS[]` (line ~349)

Array of week objects. One entry per week of the program. Each object:

```js
{
  pct: 0.70,              // fraction of 1RM for main lifts
  s: 5,                   // sets for main lifts this week
  r: 5,                   // reps for main lifts this week
  block: 'Accumulation',  // block name (shown in block-bar, used by isDl())
  rpe: 7,                 // RPE target (shown in block-bar + exercise notes)
  sqVar: 'SSB Squat',     // squat variation name (used by getExercises day 0)
}
```

- Length of this array = number of weeks in the program (currently 12).
- `block` value `'Deload'` or `'Test Week'` triggers deload logic: accessories drop to 2 sets.
- Week bar renders one pill per entry.

### 2. `DAY_LABELS[]` (line ~364)

Array of day objects. One per training day.

```js
{ short: 'D1', name: 'Lower Strength' }
```

- Length = number of days per week (currently 5).
- `short` shown in the tab pill, `name` below it.

### 3. `ALTS{}` (line ~373)

Object mapping exercise ID to array of swap alternatives.

```js
{
  squat: ['SSB Squat', 'Box Squat', 'Back Squat', 'Front Squat'],
  bench: ['Bench Press', 'Close-Grip Bench Press', 'DB Bench Press', 'Floor Press'],
  // ...
}
```

- First entry in each array is treated as the default (matches `ex.name` from `getExercises`).
- Key must match the `id` field used in `getExercises`.
- If an exercise should NOT be swappable, omit it from ALTS (it renders as a plain `<span>` instead of `<select>`).

### 4. `getExercises(dayIdx, weekIdx, maxes)` (line ~433)

Returns an array of exercise objects for the given day/week. This is where the entire program lives.

#### Exercise Object Schema

```js
{
  id: 'squat',                    // unique string key (used in log keys, ALTS lookup, PR tracking)
  name: 'Back Squat',             // default display name (before swaps)
  type: 'main',                   // 'main' | 'accessory' | 'plyo' | 'core' (shown as badge, affects timer)
  eq: 'barbell',                  // equipment tag: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bw' | 'bw+'
  sets: 5,                        // number of sets
  reps: '5',                      // string -- can be '5', '8-10', '10 /leg', '10 /side'
  wt: 135,                        // pre-calculated weight in kg (null for accessories/bodyweight)
  unit: undefined,                // optional -- 'cm' for jump height tracking (omit for normal kg+reps)
  notes: '75% / RPE 8',           // freeform notes string (shown below target)
  ss: 'A',                        // superset group key (exercises with same ss value get wrapped together)
}
```

#### Important Patterns

- **Periodized main lifts**: Use `wk.s`, `wk.r`, `wk.pct` from WEEKS to compute sets/reps/weight.
- **Weight calculation**: `round25(maxes.squat * wk.pct)` -- rounds to nearest 2.5kg.
- **Deload logic**: `const dl = isDl(weekIdx); const ds = dl ? 2 : null;` -- accessories use `ds || 3` for sets.
- **Superset grouping**: Set `ss: 'A'` on consecutive exercises to wrap them in a superset card. Use different keys ('A', 'B') for separate supersets within the same day.
- **Unit override**: Set `unit: 'cm'` (or 'in', 'm', etc.) to show a single input instead of weight+reps. Used for jumps.

#### Log Key Format

```
{weekIdx}_{dayIdx}_{exerciseId}_{setIdx}
```

Exercise IDs can contain underscores (e.g. `ghd_ext`). The parser uses `parts.slice(2, -1).join('_')` to extract the ID.

### 5. `STORAGE_KEY` (line ~409)

```js
const STORAGE_KEY = 'pb12wk_v4';
```

**Change this when creating a new program** so it doesn't collide with old data. Convention: short program abbreviation + version.

### 6. `defaultState()` (line ~500)

```js
function defaultState() {
  return {
    week: 0,
    day: 0,
    maxes: { squat: 180, bench: 125, deadlift: 200, ohp: 80 },
    log: {},
    swaps: {},
    showSettings: false,
    showPR: false,
  };
}
```

- `maxes` keys must match what `getExercises` reads from `maxes`.
- If the new program has different lifts to configure (e.g. no OHP, or adds front squat), change the maxes keys here AND in the settings modal render + save handler.

---

## Render Sections to Update

These are small inline edits within `render()`, not structural changes.

### Header Title (line ~629)
```js
h += `<h1>POWERBUILDING</h1>`;
```
Change to match the new program name.

### Block Bar (line ~636)
Already data-driven from `WEEKS[].block` and `.rpe`. No change needed unless you want different metadata.

### Week Bar (line ~642)
Loop bound is hardcoded: `for (let i = 0; i < 12; i++)`. Change `12` to `WEEKS.length`.

### Rest Info Map (line ~664)
```js
const restMap = {
  0: 'Rest: 2.5-3 min (squat) / 60-90s (isolation, SS)',
  // ...
};
```
Rewrite per-day rest guidance to match the new program.

### Notes Section (line ~765)
Static HTML with injury management, autoregulation, and progression notes. Rewrite to match the new program's context.

### Settings Modal (line ~784)
Input fields for each 1RM. Add/remove fields to match `defaultState().maxes`. Update the `saveSettings` handler (line ~851) to read the matching input IDs.

### PR Modal Filter (line ~806)
```js
const prIds = ['squat','bench','deadlift','ohp','boxjump1','boxjump2'];
```
Update to match the exercise IDs you want shown in the PR modal.

---

## Systems That Work Automatically (No Changes Needed)

| System | What it does |
|--------|-------------|
| **Timer** | Auto-starts on set check. Rest duration from `getRestSec(ex)` based on `type`, `ss`, `eq`, and ID list. Adjust the ID list in `getRestSec()` if your new program has different heavy accessories. |
| **PR Tracking** | Scans all `state.log` entries. Finds best weight per exercise ID. Shows inline on cards + in PR modal. |
| **Previous Data** | Each set row shows dimmed "prev:" from the most recent earlier week with logged data for that exercise/set. |
| **Exercise Swaps** | Renders `<select>` if exercise ID exists in `ALTS`. Stores swap choice per day in `state.swaps`. |
| **Plate Calculator** | Shows plate breakdown per side for any exercise with `eq: 'barbell'` and `wt` set. Assumes 20kg bar. |
| **Progress Bar** | Counts done sets / total sets for current day. Fully data-driven. |
| **localStorage** | Saves/loads week, day, maxes, log, swaps. Structure is program-agnostic. |
| **CSS** | Entire stylesheet is program-agnostic. Monochrome + burnt orange accent. |

---

## Timer Rest Durations (`getRestSec`)

```js
function getRestSec(ex) {
  if (ex.type === 'main') return 180;       // 3 min
  if (ex.ss) return 60;                     // 1 min (supersets)
  if (ex.eq === 'bw+') return 120;          // 2 min (weighted bodyweight)
  if (['bss1','bss2','pendulum','legpress','sealrow','ghd_ext'].includes(ex.id)) return 90;  // 90s
  return 75;                                // default for plyo/core/isolation
}
```

Update the ID list for 90s rest if the new program has different heavy accessories.

---

## Checklist: Swapping in a New Program

1. [ ] Change `STORAGE_KEY` to a new value
2. [ ] Replace `WEEKS[]` with new periodization
3. [ ] Replace `DAY_LABELS[]` with new day names
4. [ ] Replace `ALTS{}` with new exercise swap options
5. [ ] Rewrite `getExercises()` switch cases for each day
6. [ ] Update `defaultState().maxes` keys + values
7. [ ] Update header title in `render()`
8. [ ] Update week bar loop bound to `WEEKS.length` (if not 12)
9. [ ] Update `restMap` per-day strings in `render()`
10. [ ] Update notes section HTML in `render()`
11. [ ] Update settings modal inputs + save handler for new maxes
12. [ ] Update `prIds` array in PR modal for new primary lifts
13. [ ] Update `getRestSec()` ID list for heavy accessories
14. [ ] Change `STORAGE_KEY`
15. [ ] Copy `powerbuilding.html` to `index.html`
16. [ ] Push to GitHub

---

## Example: Minimal 4-Week Strength Program

To illustrate, here's what the data layer would look like for a simple 4-week squat/bench program with 3 days/week:

```js
const WEEKS = [
  { pct:.75, s:5, r:5, block:'Volume',  rpe:7,   sqVar:'Back Squat' },
  { pct:.80, s:4, r:4, block:'Volume',  rpe:8,   sqVar:'Back Squat' },
  { pct:.85, s:5, r:3, block:'Intensity', rpe:8.5, sqVar:'Back Squat' },
  { pct:.90, s:3, r:2, block:'Peak',    rpe:9,   sqVar:'Back Squat' },
];

const DAY_LABELS = [
  { short:'D1', name:'Squat' },
  { short:'D2', name:'Bench' },
  { short:'D3', name:'Accessories' },
];

const ALTS = {
  squat: ['Back Squat','Front Squat','SSB Squat'],
  bench: ['Bench Press','Close-Grip Bench','DB Bench'],
  row:   ['Barbell Row','DB Row','Cable Row'],
};

const STORAGE_KEY = 'str4wk_v1';

function getExercises(dayIdx, weekIdx, maxes) {
  const wk = WEEKS[weekIdx];
  const r = round25;
  switch(dayIdx) {
    case 0: return [
      { id:'squat', name:wk.sqVar, type:'main', eq:'barbell', sets:wk.s, reps:''+wk.r, wt:r(maxes.squat*wk.pct), notes:Math.round(wk.pct*100)+'% / RPE '+wk.rpe },
      { id:'legpress', name:'Leg Press', type:'accessory', eq:'machine', sets:3, reps:'10-12', wt:null, notes:'' },
    ];
    case 1: return [
      { id:'bench', name:'Bench Press', type:'main', eq:'barbell', sets:wk.s, reps:''+wk.r, wt:r(maxes.bench*wk.pct), notes:Math.round(wk.pct*100)+'% / RPE '+wk.rpe },
      { id:'row', name:'Barbell Row', type:'accessory', eq:'barbell', sets:3, reps:'8-10', wt:null, notes:'' },
    ];
    case 2: return [
      { id:'pullup', name:'Pull-Ups', type:'accessory', eq:'bw+', sets:4, reps:'6-10', wt:null, notes:'Log added weight' },
      { id:'curl', name:'Barbell Curl', type:'accessory', eq:'barbell', sets:3, reps:'10-12', wt:null, notes:'' },
    ];
  }
  return [];
}
```

Everything else (CSS, timer, PRs, prev data, swaps, plate calc, event handlers) works unchanged.
