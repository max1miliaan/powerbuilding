# Optional cross-device sync

The tracker works without Supabase. Entries save in this browser under `fortis-v1:`. The previous application's `pb12wk_v12` data is untouched. Clearing browser storage removes unsynced entries; use Export for a backup. Local guest entries are not automatically assigned to an account.

## Connect a project

1. Choose or create a Supabase project in your intended organization and confirm any project cost. No project has been provisioned by this change.
2. Execute `fortis-schema.sql` in that project's SQL editor. It creates a separate table, ownership policies, and a compare-and-swap RPC. Check Database Advisors after applying it.
3. Enable email/password Auth. Keep email confirmation enabled. Set Auth's Site URL to the GitHub Pages URL, and add that same URL to the redirect allowlist. Configure production SMTP for dependable confirmation mail.
4. Set the application's public Supabase URL and **publishable** key in its config. Never put a service-role key, secret key, database password, or personal access token in GitHub Pages. Bundle the pinned `@supabase/supabase-js` dependency into `vendor/supabase.js` with a named `createClient` export.
5. Sign up, confirm your email, then sign in on each device. Use Import device entries to copy guest records missing from your account. Existing account records remain unchanged. Account caches are separated by user ID.

## How sync works

Each set is a separate record (for example `1:A:bench:0`). Session metadata can use a `session:` prefix. Edits save locally before a cloud request. Sync pulls all account records in pages, then pushes pending changes. A database revision is checked atomically for every push; same-record edits from different devices become explicit conflicts. The user chooses the local or cloud version. A second newer edit may produce another conflict. Different set records merge independently. Changes made during a pending request remain queued.

The UI should call sync on focus, reconnect, and periodically while signed in. This is periodic synchronization, not an instantaneous realtime collaboration feature. Use one active editing tab per device; browser localStorage is not a transactional multi-tab database. Signing out keeps that user's local cache on the device but switches to a separate guest log. Do not use a shared browser profile for private workout history.

## Verification before enabling cloud sync

No connected project was available during implementation, so the production database and email flow require this acceptance check:

- As account A, save a set, sign in on a second device, and verify it appears.
- Edit different sets offline on both devices; reconnect and confirm both changes survive.
- Edit the same set on both devices; verify conflict resolution instead of silent replacement.
- As account B, confirm no account A records appear. Query and RPC attempts to read another user's ID must yield no rows or fail ownership checks. Anonymous clients must not read or write the table or call the RPC.
- Reload while offline; entries should remain. Sign out and verify the guest log returns. Import device entries explicitly, then verify the guest copy remains intact.

Security boundaries: the table uses RLS with `auth.uid()` ownership, the RPC is security-invoker, and only authenticated clients receive table/RPC grants. No elevated client credentials are needed. This stores workout records, not medical records.

References: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [password Auth](https://supabase.com/docs/guides/auth/passwords), [RPC](https://supabase.com/docs/reference/javascript/rpc).
