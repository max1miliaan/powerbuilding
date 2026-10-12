# Fortis training log

The user explicitly replaced the previous Gymbox tracker with the Fortis 12-week plan. README.md describes the current app. Historical program notes and changelogs are not the active prescription.

## Constraints

- Static HTML, vanilla ES modules, mobile first; GitHub Pages hosting.
- Keep index.html and powerbuilding.html byte-identical.
- Preserve the 57 verified sessions in fortis-program.js unless the user requests program changes.
- No RDLs or box jumps; four core sessions, optional fifth; 60-minute cap includes warm-up.
- No sleep, bodyweight or session-note inputs.
- Prescriptions and actual performed sets are separate. Do not silently progress based on dates or checkboxes.
- Workout data must not be committed to GitHub. Use user-scoped local storage and authenticated owner-only Supabase policies.
- Never expose a Supabase service-role or secret key. Only publishable key belongs in fortis-config.js.
- No Supabase project has been provisioned yet. Live Auth, RLS and cross-device verification are required after setup.
- npm test must pass; review mobile layout and persistence after relevant UI changes.
