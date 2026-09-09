import postgres from 'postgres';

const tables = new Set(['users','sessions','login_attempts','profiles','subjects','schedule','tasks','transactions','budgets','goals','focus_sessions','jobs','notifications','ai_messages']);
let client: ReturnType<typeof postgres> | undefined;
function getClient() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not configured');
    client = postgres(url, { ssl: 'verify-full', max: 3, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  }
  return client;
}

/** Convert only this application's legacy SQL syntax. Values remain bound parameters. */
export function postgresQuery(sql: string) {
  let index = 0;
  let quoted = false;
  let output = '';
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'") {
      output += c;
      if (quoted && sql[i + 1] === "'") { output += sql[++i]; continue; }
      quoted = !quoted;
    } else output += c === '?' && !quoted ? '$' + ++index : c;
  }
  output = output.replace(/\b(FROM|INTO|UPDATE)\s+([a-z_]+)/gi, (match, keyword, table) => tables.has(table) ? `${keyword} studentos.${table}` : match);
  return output.replace(/json_extract\(data,\s*'\$\.completed'\)\s*=\s*0/g, "(data::jsonb->>'completed')::boolean = false");
}
class Statement {
  constructor(readonly query: string, readonly values: unknown[] = []) {}
  bind(...values: unknown[]) { return new Statement(this.query, values); }
  async execute(sql: {unsafe: Function}) {
    // sql.unsafe uses SQL text from our code only; untrusted values use the second argument.
    const result = await sql.unsafe(postgresQuery(this.query), this.values);
    return { results: [...result] as Record<string, any>[], success: true, meta: { changes: result.count || 0 } };
  }
  async run() { return this.execute(getClient()); }
  async all() { return this.run(); }
  async first() { return (await this.run()).results[0] ?? null; }
}
export function connection() {
  return {
    prepare(query: string) { return new Statement(query); },
    async batch(statements: Statement[]) {
      return getClient().begin(async sql => {
        const results = [];
        for (const statement of statements) results.push(await statement.execute(sql));
        return results;
      });
    }
  };
}
