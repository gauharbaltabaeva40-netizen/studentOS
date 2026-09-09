// Route integration tests with real SQLite SQL and a local D1-compatible adapter.
// No browser, network, or hosted runtime is used.
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
const DB={prepare(sql){const statement=sqlite.prepare(sql);let values=[];return {bind(...args){values=args;return this},async first(){return statement.get(...values)||null},async all(){return {results:statement.all(...values)}},async run(){return {success:true,meta:statement.run(...values)}}}},async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const temp=await fs.mkdtemp('/tmp/studentos-api-');
try{
 globalThis.__testEnv={DB};
 const sql=await fs.readFile('tests/fixtures/legacy-sqlite.sql','utf8');for(const statement of sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await DB.prepare(statement).run();
 const routes={};
 for(const key of ['auth','data','focus','assistant']){
 const out=path.join(temp,key+'.mjs');await build({entryPoints:[`app/api/${key}/route.ts`],outfile:out,bundle:true,platform:'node',format:'esm',plugins:[{name:'test-bindings',setup(b){b.onResolve({filter:/^\.\/connection$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export function connection(){return globalThis.__testEnv.DB;}'}));}}]});routes[key]=await import(out);
 }
 const request=(route,body,cookie='',origin='https://studentos.test')=>new Request('https://studentos.test/api/'+route,{method:body?'POST':'GET',headers:{...(cookie?{cookie}:{}),...(body?{'content-type':'application/json',origin}: {})},body:body?JSON.stringify(body):undefined});
 const call=(route,body,cookie='',origin)=>routes[route][body?'POST':'GET'](request(route,body,cookie,origin));
 const register=async(contact)=>{const response=await call('auth',{action:'register',contact,password:'test-password-42',profile:{name:'Test',surname:'Student',university:'AITU',major:'Computer Science',course:1}});assert.equal(response.status,200);return {cookie:response.headers.get('set-cookie').split(';')[0],...(await response.json())};};
 assert.equal((await call('data')).status,401);
 const a=await register('student-a@example.test');const b=await register('+7 700 000 1234');
 assert.match(a.cookie,/studentos_session=/);
 const password=(await DB.prepare('select password from users where id=?').bind(a.user).first()).password;assert.notEqual(password,'test-password-42');assert.equal(password.split(':')[1].length,64);
 assert.equal((await call('auth',{action:'login',contact:'student-a@example.test',password:'wrong-pass-42'})).status,401);
 assert.equal((await call('auth',{action:'login',contact:'student-a@example.test',password:'test-password-42'})).status,200);
 const get=async(c)=>await(await call('data',undefined,c)).json();
 let d=await get(a.cookie);assert.equal(d.profiles.length,1);assert.equal(d.tasks.length,0);
 assert.equal((await call('data',{action:'onboard',profile:d.profiles[0],income:{stipend:'52000'},date:'2026-09-08',demo:true},a.cookie)).status,200);
 d=await get(a.cookie);assert.equal(d.profiles[0].onboarded,true);assert.equal(d.subjects.length,4);assert.equal(d.tasks.length,3);assert.equal(d.transactions.length,4);
 await call('data',{action:'onboard',profile:d.profiles[0],income:{stipend:'52000'},date:'2026-09-08',demo:true},a.cookie);assert.equal((await get(a.cookie)).transactions.length,4);
 await call('data',{action:'seed'},a.cookie);assert.equal((await get(a.cookie)).tasks.length,3);
 assert.equal((await get(b.cookie)).tasks.length,0);
 const task=d.tasks[0];assert.equal((await call('data',{action:'save',table:'tasks',id:task.id,data:{...task,status:'done'}},b.cookie)).status,404);
 assert.equal((await call('data',{action:'save',table:'tasks',data:task},a.cookie,'https://evil.test')).status,403);
 assert.equal((await call('data',{action:'save',table:'tasks',id:task.id,data:{...task,status:'done'}},a.cookie)).status,200);d=await get(a.cookie);assert.ok(d.tasks.find(v=>v.id===task.id).completedAt);
 for(const [table,data]of [['schedule',{title:'Calculus',day:1,start:'10:00',end:'11:00',color:'#8877ee'}],['transactions',{title:'Lunch',type:'expense',category:'food',date:'2026-09-08',amount:2000}],['goals',{title:'Learn React',progress:50,deadline:'2026-12-01'}]])assert.equal((await call('data',{action:'save',table,data},a.cookie)).status,200);
 assert.equal((await call('data',{action:'save',table:'schedule',data:{title:'Invalid',day:1,start:'11:00',end:'10:00'}},a.cookie)).status,400);
 assert.equal((await call('data',{action:'save',table:'transactions',data:{title:'Invalid',type:'expense',category:'food',date:'2026-09-08',amount:-1}},a.cookie)).status,400);
 assert.equal((await call('data',{action:'save',table:'focus_sessions',data:{}},a.cookie)).status,403);
 const start=await(await call('focus',{action:'start'},a.cookie)).json();assert.ok(start.id);
 assert.equal((await call('focus',{action:'complete',id:start.id},a.cookie)).status,400);
 assert.equal((await call('focus',{action:'complete',id:start.id},b.cookie)).status,404);
 const focus=(await get(a.cookie)).focus_sessions[0];await DB.prepare('update focus_sessions set data=? where id=?').bind(JSON.stringify({...focus,startedAt:Date.now()-1501000}),start.id).run();
 assert.equal((await call('focus',{action:'complete',id:start.id},a.cookie)).status,200);assert.equal((await call('focus',{action:'complete',id:start.id},a.cookie)).status,200);assert.equal((await get(a.cookie)).focus_sessions.filter(v=>v.completed).length,1);
 assert.equal((await call('assistant',{prompt:'Бүгін не істеуім керек?',language:'kk'},a.cookie)).status,200);assert.equal((await get(a.cookie)).ai_messages.length,2);assert.equal((await get(b.cookie)).ai_messages.length,0);
 await call('data',{action:'delete',table:'tasks',id:task.id},b.cookie);assert.ok((await get(a.cookie)).tasks.some(v=>v.id===task.id));await call('data',{action:'delete',table:'tasks',id:task.id},a.cookie);assert.ok(!(await get(a.cookie)).tasks.some(v=>v.id===task.id));
 const change=await call('auth',{action:'password',currentPassword:'test-password-42',password:'updated-password-42'},a.cookie);assert.equal(change.status,200);assert.equal((await call('data',undefined,a.cookie)).status,401);const fresh=change.headers.get('set-cookie').split(';')[0];assert.equal((await call('data',undefined,fresh)).status,200);
 await call('auth',{action:'logout'},fresh);assert.equal((await call('data',undefined,fresh)).status,401);
 console.log('PASS: registration, login, secure password storage, onboarding, idempotent demo seeding, CRUD, two-user isolation, CSRF, validation, focus timing, AI context, password rotation and logout.');
}finally{sqlite.close();await fs.rm(temp,{recursive:true,force:true});}
