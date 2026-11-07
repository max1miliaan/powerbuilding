# Fortis · Push / Pull / Legs

A mobile-first, static training log for a rolling five-day Push / Pull / Legs plan at Fortis Carlaw. The plan spans 12 calendar weeks and 60 scheduled sessions.

**Live:** https://max1miliaan.github.io/powerbuilding/

## Use

- Train on Monday, Tuesday, Thursday, Friday and Saturday, or equivalent days with two rest days. Continue **Push A → Pull A → Legs A → Push B → Pull B → Legs B** across week boundaries. Do not restart at Push A every Monday.
- Weeks 4, 8 and 12 are lighter. Keep the rotation moving; all six variants appear ten times in 60 scheduled sessions.
- Start with the short Wenning-inspired circuit, then exercise-specific ramps. The **60-minute cap includes all warm-up, ramps, rests and setup**. There are no plyometrics, RDLs or front squats.
- **Calibrate every lift manually.** No old binder weights carry into the new plan. Enter actual load, reps and RIR separately from session targets. Increase load only after successful performed exposures at the prescribed effort; a date or checkmark never increases it.
- Unilateral curls and Pallof presses record reps per side. Dumbbell loads are per hand; machine and cable settings are specific to that station.
- History, a manual rest timer and JSON export are included. Previous Fortis sessions remain available as read-only history. No bodyweight, sleep or session-note inputs.

See [PPL_PROGRAM.md](PPL_PROGRAM.md) for prescriptions, circuits, progression, timing, muscle coverage and equipment assumptions.

## Storage and sync

The existing `fortis-v1` browser storage and account isolation are preserved. New PPL record IDs use `ppl-v1` so they do not collide with previous Fortis workout records. The selected PPL view uses `fortis-ppl-view-v1`. Legacy logs are not rewritten as PPL workouts.

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
- `fortis-program-legacy.js`: archived 57-session Fortis binder prescription, retained for historical interpretation.
- `fortis-app.js`, `fortis.css`: interface, targets and session logging.
- `fortis-store.js`: existing account-isolated persistence, sync queue and conflicts.
- `fortis-config.js`: public cloud configuration, empty until provisioned.
- `tests/`: program, interface and storage checks.
- `program_notes.md`: historical context; not the active prescription.

GitHub Pages serves the public interface and program. Private workout logs stay on the device or in the user's configured authenticated cloud account.
