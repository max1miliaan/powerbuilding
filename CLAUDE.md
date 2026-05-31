# Max Workout Plan

Static HTML 5x5 powerbuilding tracker. Predecessor to the React Native workout-app.

## Stack

- Single HTML file (`powerbuilding.html` / `index.html` -- identical)
- Vanilla JS, CSS (no frameworks)
- localStorage for persistence
- Mobile-first responsive design

## Design

- Monochrome (black/white/grey + single orange accent)
- Mobile-first layout
- No emojis

## Files

- `powerbuilding.html` -- the full interactive tracker
- `index.html` -- same file (copy for GitHub Pages). Keep the two byte-identical.
- `APP_TEMPLATE.md` -- framework reference for swapping in a new program (data layer schema, checklist, example)
- `program_notes.md` -- legacy reference for the OLD Wendler 5/3/1 / conjugate program -- do not consult for the current 5x5 program

## Key Context

- 12-week fixed 5x5 compound + accessories, 5 days/week (Squat / Upper A bench / Deadlift / Pump / Upper B OHP). Day order deliberately separates the two barbell-press days and places the Pump weak-point day between deadlift and OHP
- 2 blocks x 5 training weeks + a deload week each (weeks 6 and 12)
- Main barbell lifts run a flat fixed weight per week -- no AMRAP, no ramp, no max-outs. Squat/bench/OHP 5x5; deadlift 5x3 (lower-rep, heavier, back-sparing)
- Working weight = 1RM x start% + (step x weekly increment), rounded to 2.5kg. Each block is a self-contained 5-week wave (~75% -> ~86% of 1RM); `prog` resets to 0 each block so weight never climbs into un-hittable range. Block 2 offset one increment heavier (BLOCK_BUMP) for overload
- Start %: squat 75 / bench 78 / deadlift 78 / OHP 75. Weekly increment: +5kg lower / +2.5kg upper. Resulting range: B1 75-86%, B2 78-90% (deadlift 5x3 tolerates the top end)
- Deload weeks: main lifts capped 3 sets @ 60% 1RM, accessories drop to 2 sets
- Squat and deadlift each get their own day (never the same session)
- Barbell bench & OHP each pressed heavy 5x5 1x/week; every other pressing exposure is dumbbell (DB shoulder press, incline DB) for variety and joint-friendly volume. D5 Pump is all DB/cable -- no barbell main
- Stall handling: miss the target reps on a main barbell lift 3 training weeks running -> app surfaces a banner to cut that 1RM 10% (recomputes working weights). Target is read from the lift's prescribed reps, so deadlift 5x3 checks <3, squat/bench/OHP 5x5 check <5
- Current 1RMs: Squat 180kg, Bench 125kg, Deadlift 200kg, OHP 80kg
- Injuries: patellar tendonitis (no front squats, no rebound plyos; squat one heavy day only), lower back (no RDLs, deadlift on its own day at 5x3, GHD back ext + med ball for the hinge)
- Stable accessory IDs across all 12 weeks so prev-week data carries forward in the input prefill. Note: prefill is day-scoped (`lk(prevWeek, state.day, exId, set)`), so an ID reused across days (e.g. inclinedb on D4 + D5) tracks a SEPARATE weight per day -- intended, since the rep targets differ
- Main lift IDs are fixed (back_squat / bench / deadlift / ohp); swap menus still available via ALTS
- localStorage key: `pb12wk_v11` (bumped from v10). On load with only v10 present, 1RMs are carried over and logs start fresh (5/3/1 logs are an incompatible scheme). Day index clamped to 0-4
- **Read `APP_TEMPLATE.md` before changing data shape**

## Weekly Schedule

| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----|-----|-----|-----|-----|-----|-----|
| D1 Squat | D2 Upper A | D3 Deadlift | D4 Pump | D5 Upper B | OFF | OFF |

(5 training days; rest days flexible.) Order keeps the two barbell-press days (D2 bench, D5 OHP) non-adjacent, with the Pump day between deadlift and OHP so no muscle group is loaded on back-to-back days.

## Session Summary

| Day | Exercises |
|-----|-----------|
| D1 Squat | Goblet Squat (primer), Back Squat 5x5, Bulgarian Split Squat, Seated Leg Curl, Lat Pulldown, Hanging Leg Raise |
| D2 Upper A | Band Pull-Apart (primer), Bench Press 5x5, Seated DB Shoulder Press, DB Row, Cable Fly, DB Lateral Raise, Cable Crunch |
| D3 Deadlift | GHD Hip Ext (primer), Deadlift 5x3, FFE Split Squat, GHD Back Ext + Med Ball, Chest-Supported Row, Hanging Leg Raise |
| D4 Pump | Band Pull-Apart (primer), Cable Rear Delt Fly (4 sets), DB Lateral Raise (4 sets), Lat Pulldown, Chest-Supported Row, EZ Curl SS Tricep Pushdown, Cable Crunch -- weak-point day: rear/side delts + arms, no barbell main, no duplicate pressing |
| D5 Upper B | Face Pull (primer), Standing OHP 5x5, Incline DB Press, Weighted Pull-Up, Seal Row (DB), DB Lateral Raise, EZ Curl SS Tricep Pushdown, Cable Crunch |

## Frequency

| Lift | Exposures/week |
|------|----------------|
| Squat | 1 (D1 heavy 5x5) |
| Deadlift | 1 (D3 5x3, own day) |
| Bench | 1 barbell (D2 5x5) + DB incline (D4, D5) |
| OHP | 1 barbell (D4 5x5) + DB shoulder press (D2, D5) |
| Chest (DB/cable) | incline DB D5, cable fly D2 |
| Side delts | DB lateral D2 + D5 (3) + D4 Pump (4) |
| Rear delts | cable rear fly D4 Pump (4) + face-pull primer D5 |
| Back (rows+verticals) | DB row D2, lat pulldown D1+D4, chest-supp row D3+D4, pull-up + seal row D5 |
| Arms | EZ curl SS pushdown on D4 + D5 |

Volume balance (sets/week, after D4 Pump rebuild): chest ~11, back ~22, side delts ~10, rear delts ~5, triceps ~6, biceps ~6. Push:pull ~1:1. Pump day (D4) no longer duplicates the OHP day -- it carries the rear-delt/side-delt/arm volume the heavy days lack.
