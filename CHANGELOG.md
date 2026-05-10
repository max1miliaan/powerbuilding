# Changelog

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
