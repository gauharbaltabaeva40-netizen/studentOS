import postgres from 'postgres';
import {readFile} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL in the server environment first.');
const sql=postgres(process.env.DATABASE_URL,{ssl:'verify-full',prepare:false,max:1});
try{const migration=await readFile(new URL('../database/schema.sql',import.meta.url),'utf8');await sql.begin(async tx=>{await tx.unsafe(migration)});console.log('StudentOS PostgreSQL schema is ready.');}finally{await sql.end();}
