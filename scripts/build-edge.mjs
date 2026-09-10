import { build } from 'esbuild';
await build({
  entryPoints: ['supabase/functions/studentos-api/index.ts'],
  outfile: 'dist/studentos-api/index.js',
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2022',
  mainFields: ['module', 'main'],
  define: { 'process.env.DATABASE_URL': '__databaseUrl' },
  banner: { js: 'const __databaseUrl = Deno.env.get("SUPABASE_DB_URL");' },
  plugins: [{ name: 'deno-postgres', setup(builder) {
    builder.onResolve({ filter: /^postgres$/ }, () => ({ path: 'npm:postgres@3.4.7', external: true }));
  } }],
});
console.log('Built Supabase Edge API from shared server handlers.');
