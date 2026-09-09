# Deployment handoff

GitHub repository: https://github.com/gauharbaltabaeva40-netizen/studentOS
Vercel team: gauharbaltabaeva40-3792s-projects
Requested project name: studentos

Required before production deployment:
- Connect a dedicated Supabase PostgreSQL project.
- Apply database/schema.sql.
- Inject DATABASE_URL through a secure Vercel environment-variable flow.
- Verify actual PostgreSQL transactions and account isolation.
- Deploy the exact tracked source to Vercel, check READY, and test the user journey.

Do not publish a nonfunctional registration screen or silently replace server persistence with localStorage.
