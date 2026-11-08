import {createClient} from '@supabase/supabase-js';
import type {IncomingMessage,ServerResponse} from 'node:http';
export default async function handler(req:IncomingMessage,res:ServerResponse){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 if(req.method!=='POST'){res.statusCode=405;res.end('{}');return;}
 const auth=req.headers.authorization;if(!auth?.startsWith('Bearer ')){res.statusCode=401;res.end('{}');return;}
 const db=createClient(process.env.VITE_SUPABASE_URL!,process.env.VITE_SUPABASE_ANON_KEY!,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const user=await db.auth.getUser(auth.slice(7));const reviewer=await db.from('reviewers').select('user_id').eq('user_id',user.data.user?.id||'00000000-0000-0000-0000-000000000000').maybeSingle();
 if(user.error||!reviewer.data){res.statusCode=403;res.end('{}');return;}
 const existing=await db.from('learning_runs').select('id,status').in('status',['queued','running']).maybeSingle();
 if(existing.data){res.end(JSON.stringify(existing.data));return;}
 const job=await db.rpc('request_learning').retry(false);if(job.error){res.statusCode=500;res.end('{"error":"Could not queue learning"}');return;}
 const claim=await db.rpc('claim_learning_dispatch',{p_id:job.data.id}).retry(false);if(claim.error||!claim.data){res.end(JSON.stringify({id:job.data.id,status:job.data.status}));return;}
 try{
 const response=await fetch('https://api.github.com/repos/thoomkuzhymatthew/padel-genie-content/actions/workflows/learn.yml/dispatches',{method:'POST',headers:{Authorization:'Bearer '+process.env.GITHUB_DISPATCH_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({ref:'main',inputs:{learning_run_id:job.data.id}}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Dispatch failed');res.statusCode=202;res.end(JSON.stringify({id:job.data.id,status:'queued'}));
 }catch{await db.rpc('fail_learning_dispatch',{p_id:job.data.id});res.statusCode=502;res.end('{"error":"GitHub dispatch failed. Try again."}');}
}
