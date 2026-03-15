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

- 12-week Wendler 5/3/1 + FSL + conjugate rotation: 5 days/week (Lower A / Upper A / Lower B / Upper B / Accessories)
- 5/3/1 periodization: 3 working sets per main lift (5s/3s/1s weeks), AMRAP on top set
- First Set Last (FSL): 3x5 supplemental sets at first working set weight after main sets (skipped on deload)
- Training Max (TM) escalates per cycle: 85% -> 87.5% -> 90% -> 92.5% of 1RM
- Exercise rotation every 3-week cycle across all 4 main lifts (squat, bench, deadlift, OHP variants)
- All lifts have banded + paused variants available in dropdown; no front squats
- 4 cycles x 3 weeks = 12 weeks; cycle 4 = competition lifts (2-week peak); deload at week 7
- ROTATIONS object maps rotation index (0-3) to variant per lift type
- Current 1RMs: Squat 180kg, Bench 125kg, Deadlift 200kg, OHP 80kg
- Injuries: patellar tendonitis (no rebound plyos, light leg ext), lower back (no RDLs, use GHD)
- localStorage key: `pb12wk_v6` (bumped from v5 for schema change)
- **Read `program_notes.md` before making any program changes**
- **Read `APP_TEMPLATE.md` before building a new program into the tracker**

## Weekly Schedule

| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----|-----|-----|-----|-----|-----|-----|
| D1 Lower A | D2 Upper A | OFF | D3 Lower B | D4 Upper B | D5 Accessories | OFF |

- 3 days between squat (Mon) and deadlift (Thu) for lower back/knee recovery
- 3 days between bench (Tue) and OHP (Fri) for shoulder recovery
- Wednesday rest breaks up heavy compound days
- Saturday pump day (all isolation) before Sunday rest

## Session Summary

| Day | Exercises | Sets | ~Time |
|-----|-----------|------|-------|
| D1 Lower A | Box Jump, Squat 5/3/1, FSL, Leg Curl SS HLR | 15 | 34 min |
| D2 Upper A | Bench 5/3/1, FSL, Pull-Ups, Fly SS Row, Face Pulls | 19 | 38 min |
| D3 Lower B | Deadlift 5/3/1, FSL, Pendulum, Ext SS Curl, GHD SS Sit-Ups | 21 | 41 min |
| D4 Upper B | OHP 5/3/1, FSL, Pull-Ups, Seal Row, Lat Raise SS Rear Fly | 18 | 38 min |
| D5 Accessories | Ham Press, Ham Incline, Preacher SS Tri Ext, Curl, Lat Raise SS Face Pulls, Crunch | 24 | 30 min |

## Volume (sets/week)

| Quads | Hams | Chest | Back | Shoulders | Biceps | Triceps | Core |
|-------|------|-------|------|-----------|--------|---------|------|
| ~12 | ~15 | ~15 | ~13 | ~15 | ~13 | ~15 | ~9 |
