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

- 12-week powerbuilding program: 5x/week, 60min sessions
- Current 1RMs: Squat 180kg, Bench 125kg, Deadlift 200kg, OHP 80kg
- Injuries: patellar tendonitis (no rebound plyos, light leg ext), lower back (no RDLs, use GHD)
- **Read `program_notes.md` before making any program changes**
- **Read `APP_TEMPLATE.md` before building a new program into the tracker**
