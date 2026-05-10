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

- 12-week simple Wendler 5/3/1 + FSL: 5 days/week (Squat / Bench / Deadlift / OHP / Pull-Pump)
- 3 cycles x 4 weeks. Per cycle: Wk1 5/5/5+, Wk2 3/3/3+, Wk3 5/3/1+, Wk4 deload (40/50/60% TM x5, no FSL, accessories x2)
- TM = 90% of 1RM. Cycle increments: +5kg lower / +2.5kg upper. AMRAP on top set every non-deload week
- FSL = 5x5 at first working set weight every non-deload week (hypertrophy block)
- Variant rotation per cycle: C1 = competition lift, C2 = injury-friendly variant, C3 = pause variant
- Per-day skeleton: Primer -> Main 5/3/1 -> FSL 5x5 -> 2-3 accessories -> 1 core
- D5 has no 5/3/1 main; weighted pull-up is the anchor lift (logged with added weight)
- Current 1RMs: Squat 180kg, Bench 125kg, Deadlift 200kg, OHP 80kg
- Injuries: patellar tendonitis (no front squats, leg ext is light/high-rep tendon work only), lower back (no RDLs, use GHD med-ball back ext)
- Accessories include: Bulgarian split squat, FFE split squat, GHD back ext + med ball, seated leg curl, leg ext, weighted pull-up, seal row (DB)
- Stable accessory IDs across all 12 weeks so prev-week data carries forward in the input prefill
- localStorage key: `pb12wk_v10` (bumped from v9 for schema rewrite)
- **Read `APP_TEMPLATE.md` before changing data shape**
- `program_notes.md` describes the OLD Leader/Anchor + conjugate program -- do not consult for the current simple 5/3/1 program

## Weekly Schedule

| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----|-----|-----|-----|-----|-----|-----|
| D1 Squat | D2 Bench | OFF | D3 Deadlift | D4 OHP | D5 Pull/Pump | OFF |

## Session Summary (Cycle 1)

| Day | Exercises |
|-----|-----------|
| D1 Squat | Goblet Squat, Squat 5/3/1, Squat FSL 5x5, Bulgarian Split Squat, Leg Extension, Hanging Leg Raise |
| D2 Bench | Band Pull-Apart, Bench 5/3/1, Bench FSL 5x5, DB Row, Cable Fly, DB Lateral, Cable Crunch |
| D3 Deadlift | GHD BW, Deadlift 5/3/1, DL FSL 5x5, FFE Split Squat, GHD Back Ext + Med Ball, Hanging Leg Raise |
| D4 OHP | Face Pull, OHP 5/3/1, OHP FSL 5x5, Chin-Up, EZ Curl SS Pushdown, Cable Lateral, Cable Crunch |
| D5 Pull/Pump | Band Pull-Apart, Weighted Pull-Up 4x5-8 (anchor), Seal Row DB, Seated Leg Curl, Cable Lateral, Cable Crunch |

## Volume (sets/week, hypertrophy bias)

| Quads | Hams | Chest | Back | Side Delts | Biceps | Triceps | Core |
|-------|------|-------|------|-----------|--------|---------|------|
| ~17 | ~11 | ~11 | ~13 | ~9 | ~7 | ~7 | ~15 |

Quads at 17 (slight overrun on 16-set patellar cap from BSS+FFESS+leg ext); unilateral and tendon-friendly so practical fatigue is low.
