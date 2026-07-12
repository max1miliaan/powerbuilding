# Max Workout Plan

Static HTML powerbuilding tracker. Top set + backoff, RPE-autoregulated, built to a 55-minute session budget.

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
- `index.html` -- same file (copy for GitHub Pages). **Keep the two byte-identical** (`cmp powerbuilding.html index.html`)
- `APP_TEMPLATE.md` -- framework reference for swapping in a new program
- `program_notes.md`, `research-intensity-techniques.md` -- legacy reference for OLD programs. Do not consult for the current program.

## The program

12 weeks = 3 blocks x (3 loading weeks + 1 deload). Deloads at weeks 4, 8, 12.

**Every main lift is one heavy top set + backoff sets.** No straight sets, no fixed percentages.

| Week in block | Top set | Backoff |
|---|---|---|
| 1 | 5 reps @ RPE 7 | 3 x 8 @ -8% |
| 2 | 4 reps @ RPE 8 | 3 x 7 @ -10/-11% |
| 3 | 3 reps @ RPE 9 | 3 x 6 @ -12/-14% |
| 4 | Deload: 2 x 5 @ 60%, RPE 5 | none |

**The backoff drop WAVES with the top set** (`BACKOFF[lift].drops`). A fixed 12% off a 78% top set is a sub-RPE-6 backoff -- junk volume. Waving it holds every backoff at RPE 6-7.5 all block, none over the RPE-8 cap. Bench uses a steeper wave (8/11/14%) because at 12% its W3 backoff reverse-solved to RPE 8.5, over its own cap. Deadlift uses a flat 10%: its old 15% off an already-capped top landed at 71% for 5 reps, below RPE 6.

**Why top set + backoff and not 5x5.** 5x5 forces one weight all five sets survive -- structurally ~75-82% of 1RM. You cannot run it at 88%. The old program kept the 5x5 and climbed the intensity anyway, ending above the 5RM. Top set + backoff beats it on both axes at equal session length: W1 squat gives 29 reps / 3,832kg / 78% peak vs 5x5's 25 reps / 3,437kg / 76%, and by W3 the top set reaches 88% -- an intensity 5x5 cannot express. 5x5 is also a novice linear scheme that assumes +2.5kg/week; an experienced 180kg squatter gains that per quarter.

Reps wave DOWN as intensity waves UP. This is the core fix: the previous program held 5x5 fixed while %1RM climbed to 89%, which is above a 5RM -- it prescribed sets that were mathematically uncompletable, and had no RPE cap anywhere.

## Weight derivation -- closed loop

Weight is NOT a fixed percentage of a hand-entered 1RM. It derives from a live **e1RM** per lift, which the logged top-set RPE updates each week:

```
top     = deadlift ? floorStep(...) : roundStep(lift, e1RM x pct(lift, reps, rpe))
backoff = roundStep(lift, top x (1 - drop))
```

`pct()` is an RPE->%1RM table (RTS chart) with a `-0.02` adjustment for the deadlift's poorer rep endurance. `PCT_CAP` hard-ceilings every lift at 90% (deadlift 88%).

**e1RM is replayed from the log, not stored.** `e1rmFor(lift, week)` walks the logged RPEs from the seed forward. Editing an old week's RPE recomputes everything downstream -- there is no stale-state bug class.

Autoregulation, on `d = loggedRPE - targetRPE`:

| Condition | Next e1RM |
|---|---|
| Missed the prescribed reps | x 0.95 |
| `d >= +1.5` (hit reps but RPE 10) | x 0.97 |
| `d = +1.0` | -1 INC |
| `d = +0.5` | hold |
| `d = 0` | +1 INC |
| `d = -0.5` | +1.5 INC |
| `d = -1.0` | +2 INC |
| `d <= -1.5` | +3 INC |

`INC` (weekly e1RM drift, on-plan): squat +0.75, deadlift +0.75, bench +0.5, OHP +0.25 kg/wk. Over 12 weeks this claims ~4% of 1RM. An experienced 180kg squatter gains 5-12kg per **year** -- the old `+5kg/wk` implied +14% per block, which is novice math.

Guards: e1RM clamped to `[0.85, 1.15] x seed`.

**The RPE on the top set is the only input driving the program.** Nothing else feeds back.

## Stall triggers

Evaluated on the **top set only** -- a dropped rep on backoff set 3 is normal fatigue, not a stall.

- **S2 Hard miss** -- top-set reps short in 2 consecutive loading weeks
- **S3 RPE creep** -- `rpe >= target + 1.0` in 2 consecutive weeks, *even with the reps made*. The leading indicator the old scheme had no way to see.
- **S4 Global** -- 2+ mains stalling in the same week -> surfaces a banner to deload now

The old trigger needed 3 consecutive miss weeks, but the deload landed on week 6 -- so it could effectively **never fire inside a block**.

**`stallCut()` is load-bearing and was subtly wrong once. Do not "simplify" it.** Three rules it encodes:
1. **Only RPE creep is priced here.** A missed top set is already charged x0.95 in the drift loop -- taxing it again in `stallCut` double-charges one bad week.
2. **Each stall window is charged AT MOST ONCE** (`lastCharged`). `stallFlags()` looks back two loading weeks, so consecutive weeks share weeks; without the guard the same bad week is taxed repeatedly and e1RM death-spirals (measured: 180 -> 130kg).
3. **The `[0.85, 1.15] x seed` guards run AFTER the cut, not before.** Clamping first let the cut push e1RM to 0.85 x 0.85 = 0.72 of seed, well under the stated floor.

## Lift variations (swap dropdown)

Swapping the main lift via its dropdown **rescales the load**. A pause squat at your back-squat weight is undoable; a block pull is heavier. `VARIANTS` maps each variation to a `scale` -- its fraction of the base lift's e1RM -- which multiplies the e1RM, so **the top set, the backoffs and the ramp all move together**. Anything not in `VARIANTS` scales 1.0.

The ramp and backoff are separate exercise ids (`back_squat_ramp`, `back_squat_bo`). Without this they would keep the base lift's name AND its weight after a swap. `mainBlock()` reads the swap and propagates the chosen name + scale to all three cards.

| Variation | Scale | Note |
|---|---|---|
| High Bar / SSB / Box Squat | 0.95 / 0.90 / 0.90 | |
| Pause Squat | 0.85 | 2s pause. Only when the knee is quiet. |
| Close Grip / Pause Bench | 0.90 | |
| Banded Bench Press | 0.80 | **Bar weight only** -- bands add 15-20% at lockout |
| DB Bench Press | 0.36 | **Per dumbbell**, and `eq` flips to `dumbbell` so plate math is suppressed |
| Block Pull | 1.05 | Shorter ROM -- runs HEAVIER than the full pull |
| Seated Barbell OHP | 0.95 | No leg drive |

The swap `<select>` compares against `ex.baseName`, not `ex.name` -- after a swap `ex.name` IS the variation, so comparing against it would never clear the swap.

## Plate granularity

Max owns **0.5kg plates** -> a 1.0kg pair. `STEP` is 2.5kg for squat/bench/deadlift and **1.0kg for OHP**. At 80kg a 2.5kg OHP jump is a 3.1% intensity leap and two weeks of a block collapse onto the same weight.

## Session budget

**55 minutes all-in** -- general warmup, ramp sets, working sets, rest, and station transitions. `SESSION_CAP_MIN = 55`. Current: D1 51.6 / D2 45.9 / D3 52.2 / D4 44.6 / D5 52.2. Deloads 20-35 min.

There is **no rest timer and no session clock** -- deliberately removed. The app shows a static `Est. N min` figure only.

## Schedule

| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----|-----|-----|-----|-----|-----|-----|
| D1 Squat | D2 Bench | REST | D3 Deadlift | REST | D4 Overhead | D5 Pump |

**Rest days sit BEFORE the two heavy axial sessions, not after.** Consequences:
- Squat -> Deadlift is **72h** (was 48h -- inside the erector recovery window, on a lower-back history)
- Bench -> Overhead is **96h**, with zero tricep work in between (the old program put pushdowns 24h before a 91% OHP, pre-exhausting a lockout-limited lift)
- All knee-EXTENSION load (squat, leg press, BSS) is on **D1 only** -> 144h of patellar tendon recovery. (Seated leg curl on D3 is knee FLEXION -- hamstring work, not tendon load.)
- D5 has zero legs, zero axial load, zero side delts and zero triceps, so it collides with neither Saturday's OHP nor Monday's squat. **That non-collision is the entire reason the day sits there** -- and it is why the cable crunch had to go.

## Sessions

| Day | Contents |
|-----|----------|
| D1 Squat | Squat (ramp/top/3 backoff), Leg Press 4, **Bulgarian Split Squat 3/leg**, Seated Leg Curl 4, SS[Calf Raise 4 + Pallof 3] |
| D2 Bench | Bench (ramp/top/3 backoff), SS[Incline DB 4 + Cable Rear Fly 4], SS[Lateral Raise 4 + Rope Pushdown 4], Cable Fly 3 |
| D3 Deadlift | Deadlift (ramp/top/2 backoff), GHD Back Ext + Med Ball 3, Seated Leg Curl 4, **DB Hip Thrust 4**, SS[Calf Raise 6 + Pallof 3] |
| D4 Overhead | OHP (ramp/top/3 backoff), Weighted Pull-Up 3, SS[Lateral Raise 5 + OH Tricep Ext 4], Face Pull 4 |
| D5 Pump | SS[Lat Pulldown 5 + Low-High Fly 4], SS[Cable Row 4 + Rear Fly 4], Chest-Supported Row 4, SS[Incline Curl 4 + Hammer Curl 4], HLR 5 |

122 working sets/week (ramp sets excluded -- they are warmup, not volume).

**Bulgarian split squat is a SECOND patellar exposure in one session.** That is exactly why it lives on D1 and on no other day. Cap the depth, stop at RPE 8, never to failure.

## Volume allocation -- the rule

**Direct isolation is funded INVERSELY to compound coverage.** A muscle the compounds already hammer gets few or zero direct sets; a muscle the compounds ignore gets its full MEV in direct work. Compound credit = 0.5 sets per synergist.

- **Zero direct, by design:** front delts (7.5 sets of compound credit from OHP/bench/incline -- no front raises)
- **Deliberately out of scope:** neck, traps (no shrugs), forearms/grip (no carries). These being zero is correct. Do not "helpfully" re-add them.
- **Full MEV in direct work** (compounds contribute ~nothing): rear delts 12, calves 10, hamstrings 8, side delts 9
- **Trimmed** because compounds pay for them: triceps 8 direct (+5.5 credit), biceps 8 direct (+4.5 credit)

Direct sets/week: quads 11, glutes 10, calves 10, hams 8, erectors 6, lats 8, mid-back 8, rear delts 12, side delts 9, front delts 0 (isolation), upper chest 8, mid chest 7, biceps 8, triceps 8, abs 5, obliques 6.

Fixed from the old program: calves 0 -> 10. Glutes 0 direct -> 10 (BSS + hip thrust + GHD). Hamstrings 3 -> 8 (quad:ham was 3.7:1, now 11:8). Rear delts 4 -> 12 (they were called the "priority" muscle while sitting at half of MEV). Upper chest 3 -> 8. Abs 15 -> 5 (they were overfunded above chest).

**There is ZERO loaded lumbar flexion in the program.** The cable crunch is gone. It was originally placed on D5 Sunday with a note claiming it sat "furthest from both heavy axial days" -- that was arithmetically false. Sunday is **24h before Monday's squat**, the heaviest axial session of the week (~4,265kg of bar tonnage). On a lower-back history that was the single most likely thing in the program to injure. Abs are trained by hanging leg raises plus the bracing demand of heavy squats and deadlifts.

## Supersets

**Cable or dumbbell only. Never a rack, barbell, machine, GHD, or pull-up bar.** Gymbox Farringdon is busy; you cannot hold two stations.

**ALTS invariant:** any id participating in a superset must have a cable/DB-only alternatives list, or a legal swap silently produces an illegal pairing. The old ALTS offered 'Reverse Pec Deck' and 'Machine Lateral Raise' on exactly such ids.

## Injuries

- **Patellar tendonitis** -- no front squats, no hack squat. All knee-EXTENSION load on D1 (squat, leg press, BSS). Leg press stops at 90 degrees. **`legpress` ALTS must never offer Pendulum or Belt Squat** -- both are hack-squat-family, arcing, max patellar load at the bottom, and not depth-cappable. **`DL_ALTS` must never offer the Trap Bar** -- it markedly increases the knee-extension moment and would put patellar load on D3, collapsing the 144h window to 72h.
- **Bench variations:** Pause bench kills the stretch reflex (raw strength off the chest); banded bench overloads the lockout, where the press actually fails. Both run at a lighter absolute bar weight -- and because the top set is RPE-selected rather than %-selected, the scheme adapts to that automatically with no config change.
- **Squat variations:** Box squat sits you back and REDUCES patellar load -- but never drop onto the box, plopping spikes lumbar compression. Pause squat is the opposite trade: no back risk, but sustained load at max knee flexion is what an angry patellar tendon likes least. Run it only when the knee is quiet.
- **Lower back** -- no RDLs. Deadlift capped at **RPE 8 / 88% e1RM**, 2 backoff sets not 3, and **skipped entirely on deload weeks** (one week in four with zero heavy spinal shear). GHD back ext + med ball is the only loaded hinge and never takes a plate. Exactly **one** loaded-lumbar-flexion slot in the week (cable crunch, D5).

## Data layer

- Exercise fields: `id, name, type, eq, sets, reps, wt, rest, rpeCap, cls, ss, notes`
- `type`: `ramp` | `main` | `backoff` | `accessory` | `core`. **Ramp sets are warmup, not working volume** -- excluded from the set count.
- `rest` is an EXPLICIT per-exercise field, consumed by the time model. (The old `getRestSec()` guessed from type/eq/an id list, and checked `eq==='bw+'` *before* the id list, so `ghd_med`'s entry in that list was dead code.)
- `RAMP_N` is **per-lift, not per-kg**. Keying ramp count off absolute weight meant bench and OHP could never reach 4 ramp sets while the deadlift always did, and the squat changed ramp length mid-block.
- `wt` array + comma-separated `reps` renders a ramp ladder.
- localStorage key `pb12wk_v12`. Migrating from v11 carries the 1RMs as e1RM seeds and drops the logs (ids and scheme both changed).
- Log entry: `{ done, weight, reps, rpe }`. `rpe` only ever set on a `type:'main'` top set.
- Reusing an exercise id across days is intentional -- prefill is day-scoped, so each day tracks its own weight.

## Verification

Before committing any change to the program:

```bash
node /path/to/verify-real.js   # or re-derive: extract the script, stub state/lk/getLog
```

Must all pass:
1. Every day, every week, within cap (55 min loading / 35 min deload) -- all 60 combos
2. No rack/barbell/machine/GHD/bar in any superset
3. Superset members adjacent and sharing an `ss` tag
4. Every superset id offers only cable/DB alternatives
5. No front squat / hack squat / RDL / decline sit-up / push press anywhere, **including swap menus**
6. All knee-flexion load confined to D1
7. Deadlift never above RPE 8 or 88% e1RM; skipped on deloads
8. Zero shrug/neck/grip work, and zero loaded lumbar flexion
9. `cmp powerbuilding.html index.html`
