-- Vercel PostgreSQL backend. Use a dedicated database/project for StudentOS.
-- The server connects directly; these tables are NOT exposed through Supabase's public API.
CREATE SCHEMA IF NOT EXISTS studentos;
REVOKE ALL ON SCHEMA studentos FROM PUBLIC;
CREATE TABLE IF NOT EXISTS studentos.users (
 id text PRIMARY KEY, contact text NOT NULL UNIQUE, password text NOT NULL, created_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS studentos.sessions (
 id text PRIMARY KEY,user_id text NOT NULL REFERENCES studentos.users(id) ON DELETE CASCADE,expires bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON studentos.sessions(user_id);
CREATE TABLE IF NOT EXISTS studentos.login_attempts (id text PRIMARY KEY,count integer NOT NULL,until bigint NOT NULL);
DO $$ DECLARE table_name text; BEGIN
 FOREACH table_name IN ARRAY ARRAY['profiles','subjects','schedule','tasks','transactions','budgets','goals','focus_sessions','jobs','notifications','ai_messages'] LOOP
 EXECUTE format('CREATE TABLE IF NOT EXISTS studentos.%I (id text PRIMARY KEY,user_id text NOT NULL REFERENCES studentos.users(id) ON DELETE CASCADE,data text NOT NULL CHECK(jsonb_typeof(data::jsonb)=''object''),created_at bigint NOT NULL)',table_name);
 EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON studentos.%I(user_id)',table_name||'_user_idx',table_name);
 END LOOP;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS profile_owner_unique ON studentos.profiles(user_id);
-- Defense in depth: deny direct client access. API handlers enforce session ownership.
-- Database owner is trusted server-only and bypasses RLS; never expose DATABASE_URL in client code.
DO $$ DECLARE table_name text; BEGIN
 FOREACH table_name IN ARRAY ARRAY['users','sessions','login_attempts','profiles','subjects','schedule','tasks','transactions','budgets','goals','focus_sessions','jobs','notifications','ai_messages'] LOOP
 EXECUTE format('ALTER TABLE studentos.%I ENABLE ROW LEVEL SECURITY',table_name);
 EXECUTE format('REVOKE ALL ON studentos.%I FROM PUBLIC',table_name);
 END LOOP;
END $$;
