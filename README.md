# StudentOS

Kazakh/Russian student productivity app: landing, email/phone registration, onboarding, dashboard, subjects and notes, weekly schedule, Kanban tasks, financial tracking and budgets, goals, Pomodoro, XP, analytics and profile settings.

## Deployment status

This repository is the Vercel / standard Next.js migration of the working Cloudflare edition. A PostgreSQL database must be connected and migrated before this version can accept registrations. No Vercel production deployment is claimed by this README.

## Vercel setup

1. Import this repository into Vercel as a Next.js project, or deploy the tracked source through the Vercel connector.
2. Connect a dedicated PostgreSQL database (Supabase transaction pooler supported).
3. Set `DATABASE_URL` as an encrypted **server-only** environment variable. Never prefix it with `NEXT_PUBLIC_`, commit it, or send it in chat.
4. Run `database/schema.sql` in that project's SQL editor, or run `npm run db:migrate` in a trusted environment with `DATABASE_URL` set.
5. Run `npm run build`; then deploy and verify registration → onboarding → tasks, schedule, finance and goals.

The application requires Node 22 or later. `npm run dev` starts Next.js. `npm run typecheck` checks TypeScript. `npm test` exercises route behavior and cross-user isolation against SQLite through a test adapter. It is not a live PostgreSQL or browser test.

## Architecture

- `app/api/`: authenticated same-origin endpoints
- `components/studentos/`: bilingual interface and modules
- `lib/server/connection.ts`: PostgreSQL adapter with bound parameters and atomic transactions
- `lib/server/auth.ts`: salted password hashing, hashed sessions and server verification
- `database/schema.sql`: schema actually used by this version (`studentos` namespace)
- `supabase/schema.sql`: alternative future Supabase Auth design; **do not apply this instead of database/schema.sql**

Existing Cloudflare accounts and records are not copied automatically. Plan a separate, authorized data migration if they need to be retained. The earlier Cloudflare site remains unchanged.

## Security and limits

Application-owned email/phone + password authentication is retained. This is not Supabase Auth. Passwords are salted PBKDF2-SHA256 hashes. Sessions are random, hashed in the database, expire in seven days, and use HttpOnly/Secure/SameSite cookies. Inputs are validated with Zod; writes check Origin, and all record access is scoped to the session user. Password changes revoke previous sessions.

Database tables live in a private schema with RLS enabled and no direct client grants. The trusted server connection uses the database owner role; user isolation is enforced by API queries, not by auth.uid() policies. Credentials stay on the server.

Jobs are explicitly sample vacancies; applications are local marks, not messages to employers. AI is a labeled rule-based demo. There is no email/SMS contact verification or password-recovery service yet. The full MVP has not passed browser QA. Do not call it production-ready until a real PostgreSQL connection and deployed user flows have been verified.

PostgreSQL driver transaction and pooler behavior follows the [Postgres.js documentation](https://github.com/porsager/postgres).
