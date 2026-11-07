# Fortis · Push / Pull / Legs

A mobile-first, static training log for a rolling five-day Push / Pull / Legs plan at Fortis Carlaw. The plan spans 12 calendar weeks and 60 scheduled sessions.

**Live:** https://max1miliaan.github.io/powerbuilding/

## Use

- Train on Monday, Tuesday, Thursday, Friday and Saturday, or equivalent days with two rest days. Continue **Push A → Pull A → Legs A → Push B → Pull B → Legs B** across week boundaries. Do not restart at Push A every Monday.
- Regular bench remains on Push A; Push B uses a 1-second pause, three sets of seated DB shoulder press and one cable-fly set. Back squat and conventional floor deadlift stay the default throughout all twelve weeks. Choose SSB box squat or paused deadlift explicitly before logging if planning a sustained variation block. Ab wheel, cable crunch and Pallof cover core work.
- All 60 sessions use normal work by default; weeks 4, 8 and 12 are recovery review points, not automatic deloads. Before logging, you can select a lighter session: two sets per main lift, one per accessory, all at 4+ RIR. Keep the rotation moving; all six variants appear ten times.
- Start with one easy Wenning-inspired circuit round at 8+ RIR, then ramps matching that day’s lift variation. The **60-minute cap includes all warm-up, ramps, rests and setup**. There are no plyometrics, RDLs or front squats.
- **Calibrate every lift manually.** Labelled first-trial estimates use historical binder prescriptions or clearly identified coaching guesses; they are not confirmed current strength. Explicitly apply an estimate to this session’s targets only after checking it. Actual load, reps and RIR remain separate. Progression suggestions use prior performed sets; dates and checkmarks never increase loads.
- Protect quad and hamstring-curl work and main-lift rests within the 60-minute budget; trim calf work first if necessary. User-confirmed seated machines are the defaults: seated leg curl 3×10–15 on both leg days and seated leg extension 2×10–15 on Legs A. Earlier started sessions retain their original stations, inputs and warm-up checks; new machine loads require fresh calibration.
- Unilateral curls and Pallof presses record reps per side. Dumbbell loads are per hand; machine and cable settings are specific to that station.
- Each day has a saved warm-up checklist: individual circuit movements and lift-specific ramp sets, with optional work labelled separately. Checks do not count as working sets or trigger load progression.
- History, an exercise-labelled manual rest timer and JSON export are included. The timer shows exact minutes/seconds, supports presets and a custom 15–900 seconds, and restores within this tab after reload under the same account. Set completion never starts it automatically. Previous Fortis binder, PPL v1 and PPL v2 sessions remain available as read-only history. No bodyweight, sleep or session-note inputs.

See [PPL_PROGRAM.md](PPL_PROGRAM.md) for prescriptions, circuits, progression, timing, muscle coverage and equipment assumptions.

## Storage and sync

The existing `fortis-v1` browser storage and account isolation are preserved. This revision uses `ppl-v3` record IDs so it does not collide with Fortis binder, `ppl-v1` or `ppl-v2` workouts. Main-lift identifiers also distinguish variations for performance comparisons. Previous records and their targets remain attached to their original prescriptions; PPL view selection remains separate from binder view state.

Entries save locally as you type. Browser storage can be removed by private mode, clearing site data or storage limits; export a backup periodically. Workout entries and account credentials do not belong in GitHub commits.

Cloud sync is not provisioned in this repository configuration. Existing optional account/sync behavior is unchanged: explicit guest import, revision conflict review and queued offline writes. See [Supabase setup](supabase/README.md). Mocked tests do not establish live authentication, policy or cross-device correctness.

## Develop

No application build is needed. Serve over HTTP, for example `python3 -m http.server 8000`, and open `http://localhost:8000/`. ES modules require HTTP rather than opening the file directly.

```sh
npm ci
npm test
npm run test:browser
npm run build:vendor
```

Browser checks use the bundled Chromium, or set `BROWSER_PATH` to an installed Chromium executable.

`index.html` and `powerbuilding.html` must remain byte-identical. `fortis.html` is an equivalent direct entrypoint. The locally bundled, pinned SDK loads only when cloud configuration is supplied.

## Files

- `fortis-program.js`: active rolling PPL sessions and guidance.
- `PPL_PROGRAM.md`: human-readable active plan and review rationale.
- `fortis-program-legacy.js`: archived 57-session Fortis binder prescription.
- `fortis-program-ppl-v1.js`, `fortis-program-ppl-v2.js`: archived PPL prescriptions; all archives support read-only history.
- `fortis-app.js`, `fortis.css`: interface, targets and session logging.
- `fortis-loads.js`: sourced trial-load hints and evidence-based progression suggestions.
- `fortis-warmups.js`: day-specific circuit/ramp checklists, optional steps and separate completion counts.
- `fortis-session.js`: saved session choices and frozen prescriptions that preserve logged work.
- `fortis-timer.js`: account-scoped timer state and exact countdown behavior.
- `fortis-store.js`: existing account-isolated persistence, sync queue and conflicts.
- `fortis-config.js`: public cloud configuration, empty until provisioned.
- `tests/`: program, interface and storage checks.
- `program_notes.md`: historical context; not the active prescription.

GitHub Pages serves the public interface and program. Private workout logs stay on the device or in the user's configured authenticated cloud account.
