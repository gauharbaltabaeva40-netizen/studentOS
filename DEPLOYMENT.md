# Deployment status

GitHub: https://github.com/gauharbaltabaeva40-netizen/studentOS
Vercel team: gauharbaltabaeva40-3792s-projects
Supabase project: zjjfbjldjezxlvhtbjqu
API: https://zjjfbjldjezxlvhtbjqu.supabase.co/functions/v1/studentos-api

- Applied database/schema.sql to the empty Supabase project.
- Deployed the API using Supabase's built-in database secret.
- Next.js production build and SQLite-backed route regression tests passed.
- Live PostgreSQL/API and Vercel deployment verification are in progress.

Tables are private, RLS enabled, no browser grants. The trusted database owner
connection bypasses RLS; server handlers enforce account ownership. The advisor's
RLS-without-policy information is expected for this server-only schema:
https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Original Cloudflare data is not automatically migrated. Jobs and AI use labeled
mock data/responses. Email/SMS contact verification and password recovery are not implemented.
