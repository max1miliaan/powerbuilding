# Changelog

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
