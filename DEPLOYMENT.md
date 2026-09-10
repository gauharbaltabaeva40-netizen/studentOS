# Deployment status

GitHub: https://github.com/gauharbaltabaeva40-netizen/studentOS
Vercel team: gauharbaltabaeva40-3792s-projects
Supabase project: zjjfbjldjezxlvhtbjqu
API: https://zjjfbjldjezxlvhtbjqu.supabase.co/functions/v1/studentos-api

- Applied database/schema.sql to the empty Supabase project.
- Deployed the API using Supabase's built-in database secret.
- Next.js production build and SQLite-backed route regression tests passed.
- Production: https://studentos-smoky.vercel.app
- Deployment: dpl_9X5y4rKnJXNMX2J7fNy3xMzcLw7n (READY, 2026-09-10).
- Deployed source commit: cf00e2f6a505bc694bef1d560d30869e099297e8.
- Public homepage returned HTTP 200. Live HTTP checks passed: registration, onboarding, persisted subjects/tasks, expense save/read and logout.
- No error-level Vercel runtime logs found during the initial check.
- Full browser/UI QA has not been completed. No external monitoring was configured in this deployment.

Tables are private, RLS enabled, no browser grants. The trusted database owner
connection bypasses RLS; server handlers enforce account ownership. The advisor's
RLS-without-policy information is expected for this server-only schema:
https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Original Cloudflare data is not automatically migrated. Jobs and AI use labeled
mock data/responses. Email/SMS contact verification and password recovery are not implemented.

