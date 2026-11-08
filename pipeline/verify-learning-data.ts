import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {adminClient} from './db/client.js';
import {requireEnv} from './env.js';
const db=adminClient(),client=createClient(requireEnv('SUPABASE_URL'),requireEnv('SUPABASE_ANON_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
const check=(ok:unknown,name:string)=>{if(!ok)throw Error(name);console.log('PASS '+name);};
for(const table of ['feedback_findings','atom_reviews','learning_runs','post_metrics','notification_recipients','notification_deliveries']){const r=await client.from(table).select('*');check(Boolean(r.error),'anonymous access denied: '+table);}
const login=await client.auth.signInWithPassword({email:requireEnv('REVIEWER_TEST_EMAIL'),password:requireEnv('REVIEWER_TEST_PASSWORD')});if(login.error)throw Error('Test login failed');
const base=await db.from('posts').select('*').eq('slug','uk-court-count').single();const{id:_id,render_stale:_stale,created_at:_created,updated_at:_updated,...copy}=base.data;const id=randomUUID();
await db.from('posts').insert({...copy,id,slug:'fact-review-check-'+id,run_id:'verification-fixture',status:'proposed',version:1,content_version:1,rendered_version:1});
try{
 const edit=await client.rpc('review_post',{p_post_id:id,p_action:'edit',p_expected_version:1,p_caption:copy.caption,p_content:copy.content,p_note:'The source number looks wrong; verify it.'}).retry(false);if(edit.error)throw Error('Could not create test feedback');
 const finding=await client.from('feedback_findings').select('*').eq('post_id',id);check(finding.data?.[0]?.category==='data/fact','data/fact note classified immediately');
 const flag=await client.from('atom_reviews').select('*').eq('post_id',id);check(flag.data?.[0]?.atom_ids.length>0,'linked atoms flagged for review');
 const approval=await client.rpc('review_post',{p_post_id:id,p_action:'approve',p_expected_version:edit.data.version}).retry(false);check(Boolean(approval.error),'factual flag blocks approval');
 const reportWrite=await client.from('learning_runs').insert({id:randomUUID(),status:'done'});check(Boolean(reportWrite.error),'reviewer cannot forge a completed learning report');
 const metricWrite=await client.from('post_metrics').insert({post_id:id,date:'2026-11-08',platform:'mock',impressions:1,likes:0,comments:0,shares:0,saves:0,clicks:0});check(Boolean(metricWrite.error),'reviewer cannot forge metrics');
}finally{await db.from('atom_reviews').delete().eq('post_id',id);await db.from('feedback_findings').delete().eq('post_id',id);await db.from('post_events').delete().eq('post_id',id);await db.from('posts').delete().eq('id',id);await client.auth.signOut({scope:'local'});}
