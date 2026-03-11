# Max Workout Plan

Static HTML powerbuilding tracker. Predecessor to the React Native workout-app.

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

- 12-week powerbuilding program: 4+1 days/week (4 main + 1 accessories), ~35-40min sessions
- Top set + back-off periodization (replaces 5x5): 1 top set then drop weight for back-off volume
- D1 alternates squat/deadlift weekly (even weeks = squat, odd = deadlift)
- Squat variant rotates by block: SSB (wk 1-4), Box (wk 5-8), Back Squat (wk 9-12)
- Current 1RMs: Squat 180kg, Bench 125kg, Deadlift 200kg, OHP 80kg
- Injuries: patellar tendonitis (no rebound plyos, light leg ext, squat every other week), lower back (no RDLs, use GHD)
- localStorage key: `pb12wk_v5` (bumped from v4 for schema change)
- **Read `program_notes.md` before making any program changes**
- **Read `APP_TEMPLATE.md` before building a new program into the tracker**
