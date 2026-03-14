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

- 12-week conjugate powerbuilding: 5 days/week (Lower A / Upper A / Lower B / Upper B / Accessories)
- Wave periodization: odd weeks = 5x5 volume, even weeks = build-to-heavy-set intensity ramps
- Exercise rotation every 2 weeks across all 4 main lifts (squat, bench, deadlift, OHP variants)
- 6 rotations x 2 weeks = 12 weeks; rotation 6 = competition lifts for test week
- ROTATIONS object maps rotation index (0-5) to variant per lift type
- Intensity ramps: heavy 5s -> heavy 3s -> heavy 2s -> heavy 1s (ascending across program)
- Current 1RMs: Squat 180kg, Bench 125kg, Deadlift 200kg, OHP 80kg
- Injuries: patellar tendonitis (no rebound plyos, light leg ext), lower back (no RDLs, use GHD)
- localStorage key: `pb12wk_v6` (bumped from v5 for schema change)
- **Read `program_notes.md` before making any program changes**
- **Read `APP_TEMPLATE.md` before building a new program into the tracker**
