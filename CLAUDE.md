# Fortis rolling PPL training log

The active prescription is the five-day rolling Push / Pull / Legs plan in `fortis-program.js` and `PPL_PROGRAM.md`. It replaces the four-core-session Fortis binder plan at the user's request. `fortis-program-legacy.js` preserves that 57-session plan; `program_notes.md` and older changelog entries are historical context, not active instructions.

## Constraints

- Static HTML, vanilla ES modules, mobile first; GitHub Pages hosting. Keep `index.html` and `powerbuilding.html` byte-identical.
- Twelve calendar weeks, five scheduled sessions each week, sixty sessions total. Cycle Push A / Pull A / Legs A / Push B / Pull B / Legs B continuously; do not reset weekly. Suggested days: Mon / Tue / Thu / Fri / Sat. All six variants have ten scheduled appearances.
- Weeks 4, 8 and 12 are lighter, without restarting the rotation. No optional fifth day: five training days are now the normal schedule.
- No plyometrics, explosive Olympic lifts, RDLs or front squats. Conventional deadlift is on Legs B. Current Fortis training was reported comfortable for knees/back; do not turn historical sensitivity notes into new diagnoses.
- Use the specified Fortis equipment and DB/cable substitutes. Do not assume incline/shoulder press machines, seated curls or standing calf machines exist. Equipment references: https://fortisfitness.ca/our-equipment/ and https://fortisfitness.ca/locations/fortis-fitness-east/ .
- Sixty-minute cap includes a scaled Wenning-inspired circuit, barbell ramps, rests and setup. Circuit plus ramps normally take 10–12 minutes. Lower-day unilateral curls take time; preserve main-lift rest and hamstring work, trimming the final leg-press/belt-squat/calf set when required.
- Main lifts: about 2 RIR and three-minute rests; secondary bench 2–3 RIR; accessories 2 RIR. No drops. Light weeks reduce work and use 4+ RIR.
- Circuit sets stay easy at 5+ RIR and do not count as hard work sets. They do not replace main-lift ramps or supply missing hard-set muscle volume.
- Calibrate every lift manually; no inherited binder loads. Prescriptions and performed sets remain separate. Double progression follows actual successful performed exposures, never calendar dates or completion checkboxes. Do not silently increase load or reinterpret blank loads as zero-load prescriptions.
- Preserve legacy logs as read-only History. Keep storage/auth code and the existing `fortis-v1` account isolation unchanged. New record IDs must use `ppl-v1`; PPL view selection uses `fortis-ppl-view-v1`. Never remap old records to new exercises or silently migrate logged loads.
- No sleep, bodyweight or session-note inputs. Workout data and credentials must not be committed to GitHub.
- Only public project configuration belongs in `fortis-config.js`; never expose a secret/service-role key. No cloud project is provisioned here; live Auth/policy/cross-device checks are required after setup.
- `npm test` must pass. Review mobile layout and persistence after relevant interface changes. Preserve meaningful legacy verification alongside new-program checks; do not rewrite the PDF-derived fixture to make a new prescription appear original.
