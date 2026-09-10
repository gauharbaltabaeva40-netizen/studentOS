# StudentOS

Kazakh/Russian student productivity app: landing, email/phone registration, onboarding, dashboard, subjects and notes, weekly schedule, Kanban tasks, financial tracking and budgets, goals, Pomodoro, XP, analytics and profile settings.

## Hosting

The Next.js website runs on Vercel. Its same-origin API routes proxy to the `studentos-api` Supabase Edge Function, which contains the authenticated application handlers and connects to PostgreSQL using Supabase's built-in `SUPABASE_DB_URL` secret. Vercel does not need database credentials.

## Deployment

1. Apply `database/schema.sql` to the dedicated Supabase project.
2. Run `npm ci` and `npm run build:edge`.
3. Deploy `dist/studentos-api/index.js` as the `studentos-api` Edge Function. Gateway JWT verification is disabled because this API implements its own session authentication, including public registration/login. Every private operation verifies the hashed session and user ownership.
4. Set the public API URL in `lib/server/proxy.ts`, or override it using the optional `STUDENTOS_API_URL` Vercel environment variable. This URL is not a secret.
5. Import the repository into Vercel as Next.js and run the default `npm run build` command.
6. Verify registration → onboarding → schedule/tasks/expenses/goals and login after logout against the deployed API.

The application requires Node 24. `npm run dev` starts Next.js. `npm run typecheck` checks TypeScript. `npm test` exercises route behavior and cross-user isolation against SQLite through a test adapter. It is not a live PostgreSQL or browser test.

## Architecture

- `app/api/`: same-origin API proxies on Vercel
- `lib/server/handlers/`: shared authenticated handlers
- `supabase/functions/studentos-api/`: Supabase Edge Function entrypoint
- `components/studentos/`: bilingual interface and modules
- `lib/server/connection.ts`: PostgreSQL adapter with bound parameters and atomic transactions
- `lib/server/auth.ts`: salted password hashing, hashed sessions and server verification
- `database/schema.sql`: schema actually used by this version (`studentos` namespace)
- `supabase/schema.sql`: alternative future Supabase Auth design; **do not apply this instead of database/schema.sql**

Existing Cloudflare accounts and records are not copied automatically. Plan a separate, authorized data migration if they need to be retained. The earlier Cloudflare site remains unchanged.

## Security and limits

Application-owned email/phone + password authentication is retained. This is not Supabase Auth. Passwords are salted PBKDF2-SHA256 hashes. Sessions are random, hashed in the database, expire in seven days, and use HttpOnly/Secure/SameSite cookies. Inputs are validated with Zod; writes check Origin, and all record access is scoped to the session user. Password changes revoke previous sessions.

Database tables live in a private schema with RLS enabled and no direct client grants. The trusted server connection uses the database owner role; user isolation is enforced by API queries, not by auth.uid() policies. Credentials stay on the server.

Jobs are explicitly sample vacancies; applications are local marks, not messages to employers. AI is a labeled rule-based demo. There is no email/SMS contact verification or password-recovery service yet. Browser QA and live verification results are recorded in `DEPLOYMENT.md`.

PostgreSQL driver transaction and pooler behavior follows the [Postgres.js documentation](https://github.com/porsager/postgres).
