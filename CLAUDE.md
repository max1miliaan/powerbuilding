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

- 12-week fixed 5x5 compound + accessories, 5 days/week (Squat / Upper A / Deadlift / Upper B / Pump)
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
| D1 Squat | D2 Upper A | D3 Deadlift | D4 Upper B | D5 Pump | OFF | OFF |

(5 training days; rest days flexible.)

## Session Summary

| Day | Exercises |
|-----|-----------|
| D1 Squat | Goblet Squat (primer), Back Squat 5x5, Bulgarian Split Squat, Seated Leg Curl, Lat Pulldown, Hanging Leg Raise |
| D2 Upper A | Band Pull-Apart (primer), Bench Press 5x5, Seated DB Shoulder Press, DB Row, Cable Fly, DB Lateral Raise, Cable Crunch |
| D3 Deadlift | GHD Hip Ext (primer), Deadlift 5x3, FFE Split Squat, GHD Back Ext + Med Ball, Chest-Supported Row, Hanging Leg Raise |
| D4 Upper B | Face Pull (primer), Standing OHP 5x5, Incline DB Press, Weighted Pull-Up, Seal Row (DB), DB Lateral Raise, EZ Curl SS Tricep Pushdown, Cable Crunch |
| D5 Pump | Band Pull-Apart (primer), Incline DB Press, Seated DB Shoulder Press, Lat Pulldown, Chest-Supported Row, DB Lateral Raise, Cable Rear Delt Fly, EZ Curl SS Tricep Pushdown, Cable Crunch |

## Frequency

| Lift | Exposures/week |
|------|----------------|
| Squat | 1 (D1 heavy 5x5) |
| Deadlift | 1 (D3 5x3, own day) |
| Bench | 1 barbell (D2 5x5) + DB incline (D4, D5) |
| OHP | 1 barbell (D4 5x5) + DB shoulder press (D2, D5) |
| Chest (DB/cable) | incline DB D4+D5, cable fly D2 |
| Side delts | DB lateral D2+D4+D5 |
| Back (rows+verticals) | DB row D2, lat pulldown D1+D5, chest-supp row D3+D5, pull-up + seal row D4 |

Volume balance (sets/week): chest ~17, back ~22, side delts ~9, rear delts ~3. Push:pull ~1.2:1 (was ~2:1 before the D1/D3/D5 pull additions). Verticals 10, horizontals 12.
