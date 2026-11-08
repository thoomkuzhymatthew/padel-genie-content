import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { Post, PostEvent, Reviewer, Status } from './lib/types';
import { PostCard, type ReviewAction } from './components/PostCard';
const tabs:{status:Status;label:string}[]=[{status:'proposed',label:'Proposed'},{status:'approved',label:'Approved'},{status:'posted',label:'Posted'},{status:'rejected',label:'Rejected'}];
function Brand(){return <div className="brand"><i/>Padel Genie</div>;}
function Login(){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const submit=async(event:FormEvent)=>{event.preventDefault();setBusy(true);setError('');try{const result=await supabase.auth.signInWithPassword({email,password});if(result.error)setError('That email and password didn’t work. Please try again.');}catch{setError('Could not connect. Please try again.');}finally{setBusy(false);}};
 return <main className="login-layout"><section className="login-story"><Brand/><div><span className="login-kicker">Your social intern</span><h1>Good data.<br/>A sharper story.</h1><p>I turn Padel Genie’s reports into social drafts.<br/>You bring the judgement.</p></div><span className="login-foot">The human stays in the loop.</span></section><section className="login-panel"><form onSubmit={submit}><span className="login-icon">↗</span><h2>Welcome back.</h2><p>Your next draft is waiting for a second pair of eyes.</p><label>Email<input autoComplete="username" type="email" required value={email} onChange={event=>setEmail(event.target.value)}/></label><label>Password<input autoComplete="current-password" type="password" required value={password} onChange={event=>setPassword(event.target.value)}/></label>{error?<p role="alert" className="inline-error">{error}</p>:null}<button type="submit" className="primary" disabled={busy}>{busy?'Signing in…':'Sign in'}</button><p className="login-private">Private workspace for the Padel Genie team.</p></form></section></main>;
}
export default function App(){
 const[session,setSession]=useState<Session|null>(null),[initializing,setInitializing]=useState(true),[loading,setLoading]=useState(false);
 const[posts,setPosts]=useState<Post[]>([]),[events,setEvents]=useState<PostEvent[]>([]),[reviewers,setReviewers]=useState<Reviewer[]>([]);
 const[status,setStatus]=useState<Status>('proposed'),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{let active=true;supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);setInitializing(false);}});const{data}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setInitializing(false);if(!next){setPosts([]);setEvents([]);setReviewers([]);}});return()=>{active=false;data.subscription.unsubscribe();};},[]);
 const refresh=useCallback(async()=>{
  if(!session)return;setLoading(true);setError('');
  try{const[p,e,r]=await Promise.all([supabase.from('posts').select('*').order('created_at',{ascending:false}),supabase.from('post_events').select('id,post_id,actor_id,type,note,reason,reason_tags,created_at,diff').order('created_at',{ascending:false}).limit(200),supabase.from('reviewers').select('*')]);if(p.error||e.error||r.error)throw Error('Could not load the inbox. Please refresh.');setPosts((p.data||[]) as Post[]);setEvents((e.data||[])as PostEvent[]);setReviewers((r.data||[])as Reviewer[]);}catch(error){setError(error instanceof Error?error.message:'Could not load the inbox.');}finally{setLoading(false);}
 },[session]);
 useEffect(()=>{if(session)void refresh();},[session,refresh]);
 useEffect(()=>{const focus=()=>{if(session)void refresh();};window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus);},[session,refresh]);
 const action=async(post:Post,change:ReviewAction)=>{
  const{data,error}=await supabase.rpc('review_post',{p_post_id:post.id,p_action:change.action,p_expected_version:post.version,p_caption:change.caption??null,p_content:change.content??null,p_note:change.note??null,p_reason:change.reason??null,p_reason_tags:change.tags??[]}).retry(false);
  if(error){if(error.code==='PT409')await refresh();throw Error(error.message);}
  setPosts(previous=>previous.map(item=>item.id===post.id?data as Post:item));
  setNotice(change.action==='edit'?'Changes saved.':change.action==='approve'?'Draft approved.':change.action==='reject'?'Feedback saved.':'Marked as posted.');
  await refresh();
 };
 const me=reviewers.find(reviewer=>reviewer.user_id===session?.user.id);
 const visible=posts.filter(post=>post.status===status);
 if(initializing)return <div className="loading-screen"><Brand/><p>Opening your inbox…</p></div>;
 if(!session)return <Login/>;
 return <div className="app-shell"><aside className="sidebar"><Brand/><div className="workspace-label">The intern inbox</div><nav aria-label="Draft status">{tabs.map(tab=><button key={tab.status} aria-current={status===tab.status?'page':undefined} onClick={()=>{setStatus(tab.status);setNotice('');}}><span>{tab.label}</span><span className="tab-count">{posts.filter(post=>post.status===tab.status).length}</span></button>)}</nav><div className="reviewer"><span className="reviewer-avatar">{me?.display_name.slice(0,1)||'·'}</span><div><strong>{me?.display_name||'Reviewer'}</strong><button onClick={()=>void supabase.auth.signOut()}>Sign out</button></div></div></aside><main className="inbox-main"><header className="inbox-header"><div><div className="intern-presence"><i/>Your social intern</div><h1>Ready when you are.</h1><p>{status==='proposed'?'Fresh drafts, backed by Padel Genie data.':{approved:'Ready for you to post.',posted:'Your posted archive.',rejected:'Feedback I can learn from.'}[status]}</p></div><button className="refresh" disabled={loading} onClick={()=>void refresh()} aria-label="Refresh inbox">{loading?'↻ Refreshing…':'↻ Refresh'}</button></header><div className="feed-title"><h2>{tabs.find(tab=>tab.status===status)?.label}</h2><span>{visible.length} {visible.length===1?'draft':'drafts'}</span></div>{notice?<p role="status" className="toast">{notice}</p>:null}{error?<p role="alert" className="inline-error">{error}</p>:null}{!loading&&!me&&!error?<div className="empty-state"><h2>Reviewer access needed</h2><p>This account isn’t on the reviewer list.</p></div>:visible.length?<div className="feed">{visible.map(post=><PostCard key={post.id} post={post} events={events.filter(event=>event.post_id===post.id)} reviewers={reviewers} onAction={action}/>)}</div>:!loading?<div className="empty-state"><span>↗</span><h2>{status==='proposed'?'All caught up.':'Nothing here yet.'}</h2><p>{status==='proposed'?'New drafts will appear here when the next batch is ready.':'Review a proposed draft to start filling this tab.'}</p></div>:<p className="loading-copy">Loading your drafts…</p>}</main></div>;
}
