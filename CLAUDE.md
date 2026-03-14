# Max Workout Plan

Static HTML conjugate-inspired powerbuilding tracker. Predecessor to the React Native workout-app.

## Stack

- Single HTML file (`powerbuilding.html` / `index.html` -- identical)
- Vanilla JS, CSS (no frameworks)
- localStorage for persistence
- Mobile-first responsive design

## Design

- Monochrome (black/white/grey only)
- Mobile-first layout
- No emojis

## Files

- `powerbuilding.html` -- the full interactive tracker
- `index.html` -- same file (copy for GitHub Pages)
- `program_notes.md` -- complete program reference with all decisions and rationale
- `APP_TEMPLATE.md` -- framework reference for swapping in a new program (data layer schema, checklist, example)

## Key Context

- 12-week Wendler 5/3/1 + conjugate rotation: 5 days/week (Lower A / Upper A / Lower B / Upper B / Accessories)
- 5/3/1 periodization: 3 working sets per main lift (5s/3s/1s weeks), AMRAP on top set
- Training Max (TM) escalates per cycle: 85% -> 87.5% -> 90% -> 92.5% of 1RM
- Exercise rotation every 3-week cycle across all 4 main lifts (squat, bench, deadlift, OHP variants)
- 4 cycles x 3 weeks = 12 weeks; cycle 4 = competition lifts for peak; deload at week 7
- ROTATIONS object maps rotation index (0-3) to variant per lift type
- Current 1RMs: Squat 180kg, Bench 125kg, Deadlift 200kg, OHP 80kg
- Injuries: patellar tendonitis (no rebound plyos, light leg ext), lower back (no RDLs, use GHD)
- localStorage key: `pb12wk_v6` (bumped from v5 for schema change)
- **Read `program_notes.md` before making any program changes**
- **Read `APP_TEMPLATE.md` before building a new program into the tracker**
