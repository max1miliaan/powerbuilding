# Fortis · Training log

A mobile-first, static 12-week training log for Fortis Carlaw.

**Live:** https://max1miliaan.github.io/powerbuilding/

## Use

- Choose a week and session A–D. E is optional and omitted in lighter weeks.
- Targets come from the verified Fortis training binder: 48 core sessions and 9 optional sessions.
- Enter actual load/reps/RIR, or tap **Use target** to fill the prescription, then mark the set complete.
- Unilateral work records left/right reps. Sleds and carries record metres and effort. Broad jumps can record distance in cm.
- Adjustments are manual and session-specific. Missed rep targets should be repeated, not automatically advanced.
- History, a manual rest timer, and JSON export are included. No bodyweight, sleep or session-note fields.

## Storage and sync

Logs save to browser localStorage immediately in a fresh `fortis-v1` namespace. The older tracker is replaced; none of its logs are automatically imported. Browser data can be removed by private mode, clearing site data or browser storage limits. Export a backup periodically.

Cloud sync is **not provisioned yet**. The connected Supabase account had no projects when this app was built. Configuration remains empty until a project is approved and created. No secret keys or workout entries belong in this repository.

Once configured, sign in on each device with the same account. Guest entries are imported only via an explicit action. Per-record compare-and-swap detects simultaneous edits; conflict resolution presents both versions. Offline writes queue locally and retry. See [Supabase setup](supabase/README.md).

## Develop

No build is needed to serve the app. Use a static HTTP server, for example `python3 -m http.server 8000`, and open `http://localhost:8000/`. ES modules require HTTP rather than opening the file directly.

```sh
npm ci
npm test
npm run build:vendor
```

The pinned, locally bundled Supabase SDK is loaded only when configured. `package-lock.json` is committed. `index.html` and `powerbuilding.html` are byte-identical entrypoints. `fortis.html` is an equivalent direct link.

## Files

- `fortis-program.js`: all prescriptions and guidance; independent PDF-derived fixture verifies every load, rep and set.
- `fortis-app.js`, `fortis.css`: interface and session logic.
- `fortis-store.js`: account-isolated persistence, cloud queue and conflicts.
- `fortis-config.js`: public Supabase project URL and publishable key, empty until provisioned.
- `supabase/fortis-schema.sql`: authenticated owner-only table and revision-checked RPC.
- `tests/`: program and storage tests. Mocked cloud tests do not replace live Auth/RLS validation.

GitHub Pages serves the public interface and program. Private logs remain on the device or in the user's authenticated Supabase account, never in GitHub commits.
