# Changelog

## [2026-05-31d] -- push/pull balance (red-team HIGH)

### What changed
- Added back volume to fix the ~2:1 push:pull imbalance flagged in the red-team audit
- D1 Squat: added Lat Pulldown (vertical pull)
- D3 Deadlift: added Chest-Supported Row (horizontal pull, no lumbar load)
- D5 Pump: dropped Cable Fly (chest was over-covered at 3x/week), added Lat Pulldown + Chest-Supported Row; trimmed DB Lateral Raise from 4 sets to 3
- New accessory IDs `latpd` (Lat Pulldown) and `csrow` (Chest-Supported Row) with ALTS + PR_NAMES entries

### Why
- Audit found push ~34 sets vs pull ~19 (nearly 2:1); D5 was 100% push with zero back work; vertical pulling was only 4 sets/week
- Imbalance is a posture / shoulder-health risk over a 12-week block

### Result (weekly working sets)
- Chest 17, back (rows+verticals) 22, rear delt 3, side delt 9
- Push:pull now ~1.2:1 (with rear delts ~1.1:1); back now exceeds chest
- Verticals 10 (pull-up + lat pulldown), horizontals 12 (DB row + seal row + chest-supp row)

## [2026-05-31c] -- progression curve fix (red-team CRITICAL)

### What changed
- Fixed the working-weight progression: `prog` was cumulative across both blocks (0-9), making it a single 10-week linear climb that crossed un-hittable loads (squat/bench/OHP hit 94-97% of 1RM by the end -- impossible for 5x5)
- `prog` now resets to 0 each block; each block is a self-contained 5-week wave. Added `BLOCK_BUMP` (block 2 starts one increment heavier than block 1) for cross-block overload
- Raised start %: squat 70->75, bench 75->78, deadlift 72->78, OHP 70->75, so the wave spans a proper 5x5 range (~75% -> ~86%) instead of starting too light and overshooting
- `workWeight` now computes `step = prog + cycle * BLOCK_BUMP`
- Resulting %1RM: B1 squat 75-86 / bench 78-86 / DL(5x3) 78-88 / OHP 75-88; B2 squat 78-89 / bench 80-88 / DL 80-90 / OHP 78-91

### Why
- Red-team audit flagged the cumulative-prog curve as a critical flaw: block 2 was entirely in the dead zone (no one can 5x5 at 94%+), so the program was unrunnable past ~week 5 and the stall banner would fire every block by design
- Per-block waves with a small inter-block bump keep every week in a trainable 5x5 zone while still progressing across the 12 weeks

### Decisions
- Picked the per-block-wave fix (over smaller increments or a lower start) as the single highest-value correction -- it makes the engine sound; push/pull volume balance (also flagged) deferred
- Block 2 peak weeks (squat 89%, OHP 91%) are deliberately stiff -- they are the final week before a deload, and the stall->10% banner is the safety valve
- Corrected a CLAUDE.md error: shared accessory IDs are day-scoped in prefill, NOT shared across days

## [2026-05-31b] -- 5-day split + dumbbell pressing

### What changed
- Expanded 4-day Upper/Lower to a 5-day split: D1 Squat, D2 Upper A, D3 Deadlift, D4 Upper B, D5 Pump
- Squat and deadlift now have separate days (no squat+deadlift in one session). Deadlift moved to its own day as 5x3 (lower-rep, heavier, back-sparing) instead of a 1x5 tacked onto squat day
- Removed the second squat day (old D3 volume squat @90%); squat is now one heavy 5x5 day
- Replaced both secondary barbell presses with dumbbell work: D2 bench day now has Seated DB Shoulder Press, D4 OHP day now has Incline DB Press (barbell bench & OHP each pressed 1x/week)
- Added D5 Pump: no barbell main -- incline DB, DB shoulder press, cable fly, DB lateral (4 sets), rear delt fly, EZ curl SS pushdown, cable crunch
- New accessory IDs: `db_ohp` (Seated DB Shoulder Press), reuse of `inclinedb` / `rearfly`. ALTS + PR_NAMES updated
- Stall detector now reads each lift's prescribed rep target (deadlift 5x3 checks <3 reps, not a hardcoded 5); `isMissWeek`/`missStreak` scan 6 set slots; banner fires for any main barbell lift, not just 5-set lifts
- Rest map gained a D5 entry; notes section rewritten for the 5-day split; day-clamp guard widened to 0-4

### Why
- User wanted more dumbbell chest/shoulder work and less constant barbell bench/OHP
- Squat + deadlift in the same session was excessive lower-back and recovery load
- A 5th pump-focused day adds hypertrophy volume for chest, delts, and arms

### Decisions
- Deadlift 5x3 (not 5x5) on its own day -- volume-matched-ish to a heavy single but lower lumbar fatigue; squat stays 5x5
- DB pressing slots use prev-week prefill (no 1RM math), so they progress by nudging the prefilled weight
- Shared accessory IDs (inclinedb, db_ohp, cablefly, latraise, ezcurl_pd, pushdown_pd) intentionally reused across days so prev-week prefill carries the working weight between sessions

## [2026-05-31] -- 5x5 rebuild

### What changed
- Replaced Wendler 5/3/1 + FSL with a fixed 5x5 compound + accessories program (no AMRAP, no max-outs -- volume focus)
- Restructured 5-day (Squat/Bench/DL/OHP/Pull) into 4-day Upper/Lower: D1 Lower A, D2 Upper A, D3 Lower B, D4 Upper B
- Main lifts run flat 5x5 at a fixed working weight per week. Working weight = 1RM x start% + weekly increment (start %: squat 70 / bench 75 / deadlift 72 / OHP 70; +5kg lower / +2.5kg upper per week)
- 12 weeks = 2 blocks x 5 training weeks + deload (weeks 6 and 12). Deload = 3x5 @ 60% 1RM, accessories x2
- Each main lift trained ~2x/week (heavy 5x5 + lighter/secondary). Deadlift 1x/week (single top set of 5)
- Replaced the AMRAP -> 1RM auto-bump with stall detection: miss 5 reps on a main 5x5 lift 3 training weeks running -> banner to cut that 1RM 10% (`cutRM` action)
- Removed: variant rotation (C1/C2/C3), FSL supplemental, Epley auto-1RM-suggest, D5 pull/pump day, leg extension, cable lateral (D4), rear delt fly (D5), chin-up
- Dropped engine: `getTM`, `ROTATIONS`, `CYCLE_INC`, `WEEK_5S/3S/531`, `fslLift`, `est1RM`, `getCurrentVariant`. Added: `START_PCT`, `INC`, `workWeight`, `MAIN_LIFTS`, `mainKeyForId`, `isMissWeek`, `missStreak`, rebuilt `mainLift`
- localStorage key bumped pb12wk_v10 -> pb12wk_v11. v10 -> v11 load carries 1RMs only, logs start fresh (incompatible scheme); day index clamped 5-day -> 4-day
- Header renamed 5/3/1 + FSL -> 5X5 + ACCESSORIES; notes section + rest map rewritten for 5x5

### Why
- User got bored of going for maxes (AMRAP/top singles) and wanted more volume work -- a fixed 5x5 + accessory structure
- Upper/Lower at 4 days gives each main lift ~2x/week frequency with hypertrophy accessory volume

### Decisions
- Deadlift 1x/week, single top set of 5 -- 5x5 deadlift twice/week is excessive recovery and lumbar load (lower-back injury); posterior chain volume comes from GHD back ext + med ball on D3
- Squat frequency split into one heavy day (D1) + one lighter volume day (D3 @90%) to manage patellar tendon load
- Fixed main-lift IDs (no rotation) so prev-week prefill and PR tracking stay correct; swaps still available via ALTS
- Stall -> 10% 1RM cut surfaced as a banner (manual confirm), not auto-applied -- mirrors the old bump-confirm pattern
- Linear weekly progression runs working weights toward 90-95%+ of 1RM by end of each block by design; the stall banner is the safety valve

## [2026-05-10b] -- weakpoint patches
### What changed
- Wk1 of every cycle is now 5/5/5 (no AMRAP) -- Leader-style fatigue management. AMRAP only on Wk2 (3+) and Wk3 (1+)
- D1 leg extension dropped from 3 sets to 2 (patellar quad volume cap: 17 -> 14)
- D2 added Incline DB Press 3x8-10 as 4th accessory (chest volume 11 -> 14)
- D5 swapped Cable Lateral Raise for Cable Rear Delt Fly (rear delt + upper back volume up; side delt unaffected, still hit on D2 + D4)
- New AMRAP -> 1RM bump suggestion: when an AMRAP top set is logged with reps that imply a higher 1RM (Epley), the app surfaces a banner with the new estimate and an "Update 1RM" button. Confirms before writing to maxes.
- Notes section updated to reflect Wk1 no-AMRAP and the 1RM auto-suggest behaviour
- Storage key unchanged (pb12wk_v10) -- no schema change to logged data

### Why
- Self-audit identified weak points: quad volume slightly over patellar cap, chest borderline, AMRAP every working week compounds CNS fatigue for advanced lifter, manual TM/1RM bumps easy to miss
- These 4 patches address the highest-value items without restructuring the program

## [2026-05-10]
### What changed
- Replaced Wendler Forever Leader/Anchor + conjugate program with simple Wendler 5/3/1 + FSL 5x5
- 12 weeks = 3 cycles x 4 weeks (Wk1 5/5/5+, Wk2 3/3/3+, Wk3 5/3/1+, Wk4 deload 40/50/60% TM)
- TM = 90% of 1RM. Cycle increments: +5kg lower / +2.5kg upper
- Variant rotation per cycle: C1 competition / C2 injury-friendly / C3 pause
- New per-day skeleton: Primer -> Main 5/3/1 -> FSL 5x5 -> 2-3 accessories -> 1 core
- D5 (Pull/Pump) anchored by weighted pull-up; no 5/3/1 main
- Removed: plyometrics (box jump, med ball slam, plyo pushup, seated box jump), sled push, prehab block (wall sit + band walks), Hammer incline rest-pause, lat pulldown, preacher curl, drop sets, pyramid sets, intensity techniques generally
- Added accessories per request: Bulgarian split squat, FFE split squat, GHD back ext + med ball, seated leg curl, leg ext (light/high-rep for patellar), weighted pull-up, seal row (DB)
- Removed accessory: hip thrust (per user)
- Inputs now pre-fill with previous week logged value when no programmed weight (accessories, weighted pull-up, FSL). Prior-week label brightened (orange, larger) and shows source week
- localStorage key bumped pb12wk_v9 -> pb12wk_v10
- Header renamed POWERBUILDING -> 5/3/1 + FSL

### Why
- User asked for a simpler Wendler program: 1 primer + main + 2-3 accessories + 1 core per day, with all set/rep/kg prescribed from 1RM
- Earlier program had Leader/Anchor periodization, conjugate rotation, intensity techniques (myo-rep, drop, rest-pause), 4 cycles. Simpler version drops all of that for a canonical Wendler structure with one hypertrophy block (FSL 5x5)
- Previous-week visibility added so accessory weight progression is one-tap (just nudge the prefill)

### Decisions
- 5 days, not 4: D5 is a dedicated pull/pump day with weighted pull-up as anchor (no 5/3/1 % lift); fits user's 5-day cadence and the "main lift each day" spec via the anchor pattern
- Stable accessory IDs across all 12 weeks (bss, ffess, dbrow, sealrow, etc.) so prev-week prefill carries
- Main lift IDs rotate per cycle (back_squat -> box_squat -> pause_squat) so prev-week is correctly scoped to same variant only
- TM stored as raw kg (not fraction); computed in getTM(liftKey, weekIdx, maxes) from BASE_TM_PCT + cycle increment
- Old `program_notes.md` left in place as legacy reference; flagged in CLAUDE.md as "do not consult for current program"

## [2026-03-11]
### What changed
- Complete program redesign: Wendler 5/3/1 + FSL + conjugate rotation
- Added First Set Last (FSL) 3x5 supplemental on all main lifts (D1-D4)
- Rebalanced volume: more chest/quads/hams, less core
- Restored cycle 3 full 3 weeks, cycle 4 as 2-week peak
- Trimmed D1 (removed leg press) and D2 (removed plyo push-ups)
- Added face pulls to D2 for shoulder health
- Dropped tricep pushdown from D5 (tricep volume was excessive at 18 sets/wk)
- Removed front squat from swap options
- Added banded OHP and pause OHP to swap options
- All four lifts now have banded + paused variants available

### Why
- Moved from wave periodization (5x5 + heavy ramps) to Wendler 5/3/1 for better fatigue management
- FSL adds supplemental volume without excessive CNS load
- Volume audit revealed chest too low (~6 sets/wk) and core too high (~18 sets/wk) -- rebalanced
- D1 was 18 sets / ~45 min with 9 quad sets on one day -- trimmed to 15 sets / ~34 min
- D2 plyo push-ups were low impact relative to actual bench training
- Rear delts needed work on pressing day for shoulder balance

### Decisions
- FSL uses fixed IDs (fsl_sq, fsl_bp, fsl_dl, fsl_oh) not variant IDs for consistent logging across rotations
- FSL returns null on deload weeks, filtered from exercise array
- Cycle 4 is 2-week peak (3s + 1s only) to keep program at 12 weeks after restoring cycle 3
- Weekly schedule: Mon D1 / Tue D2 / Wed OFF / Thu D3 / Fri D4 / Sat D5 / Sun OFF
- No front squats (patellar tendonitis)
- Tricep isolation capped at 1 exercise on D5 (pressing volume covers the rest)
