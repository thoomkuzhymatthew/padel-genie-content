import { useState } from 'react';
import type { Content, Post, PostEvent, Reviewer } from '../lib/types';
import { reasonTags } from '../lib/types';
import { formatLabel, timeLabel } from '../lib/content';
import { Preview } from './Preview';
import { Editor } from './Editor';
export type ReviewAction={action:string;caption?:string;content?:Content;note?:string;reason?:string;tags?:string[]};
type Props={post:Post;events:PostEvent[];reviewers:Reviewer[];onAction:(post:Post,action:ReviewAction)=>Promise<void>};
export function PostCard({post,events,reviewers,onAction}:Props){
 const[editing,setEditing]=useState(false),[rejecting,setRejecting]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const[tags,setTags]=useState<string[]>([]),[reason,setReason]=useState('');
 const run=async(action:ReviewAction)=>{setBusy(true);setError('');try{await onAction(post,action);setEditing(false);setRejecting(false);}catch(error){setError(error instanceof Error?error.message:'Could not save. Try again.');}finally{setBusy(false);}};
 const last=events[0];const name=last?reviewers.find(reviewer=>reviewer.user_id===last.actor_id)?.display_name||'Reviewer':'';
 const verb=last?{approve:'Approved',edit:'Edited',reject:'Rejected',posted:'Marked as posted'}[last.type]:'';
 return <article className="post-card" aria-label={post.story} data-post-id={post.id}>
 <div className="intern-message"><span className="avatar">pg</span><div><div className="message-heading"><strong>Your intern</strong><span>{formatLabel(post.format)}</span></div><p>{String(post.trace.intern_message||`I’ve read ${post.source_title}. ${post.story}`)}</p><p className="rationale">{String(post.trace.why_it_works||'One clear story, backed by verified Padel Genie data.')}</p><a className="source-link" href={post.source_url} target="_blank" rel="noreferrer">Read the source ↗</a></div></div>
 <div className="social-post"><div className="social-header"><span className="social-avatar">pg</span><div><strong>Padel Genie</strong><span>Post preview · {formatLabel(post.format)}</span></div></div><Preview post={post}/><div className="caption"><strong>Padel Genie</strong><p>{post.caption}</p></div></div>
 {last?<div className="activity"><span>{verb} by {name} · {timeLabel(last.created_at)}</span>{last.note?<p>“{last.note}”</p>:null}{last.type==='reject'?<p>{[...(last.reason_tags||[]),last.reason].filter(Boolean).join(' · ')}</p>:null}</div>:<p className="activity">Ready for your first look.</p>}
 {error?<p className="inline-error" role="alert">{error}</p>:null}
 {editing?<Editor post={post} busy={busy} onCancel={()=>setEditing(false)} onSave={(caption,content,note)=>run({action:'edit',caption,content,note})}/>:null}
 {rejecting?<form className="reject-form" onSubmit={event=>{event.preventDefault();void run({action:'reject',tags,reason});}}><h3>What missed the mark?</h3><p className="helper">Choose a reason or add your own. I’ll keep it with this draft.</p><div className="reason-chips">{reasonTags.map(tag=><button key={tag} type="button" aria-pressed={tags.includes(tag)} onClick={()=>setTags(previous=>previous.includes(tag)?previous.filter(value=>value!==tag):[...previous,tag])}>{tag}</button>)}</div><label>Your reason<textarea aria-label="Rejection reason" maxLength={2000} rows={2} value={reason} onChange={event=>setReason(event.target.value)} placeholder="Anything else I should know?"/></label><div className="form-actions"><button className="danger" disabled={busy||(!tags.length&&!reason.trim())} type="submit">Reject draft</button><button type="button" disabled={busy} onClick={()=>setRejecting(false)}>Cancel</button></div></form>:null}
 {!editing&&!rejecting?<div className="post-actions">{post.status==='proposed'?<button className="primary" disabled={busy||post.render_stale} onClick={()=>void run({action:'approve'})}>Approve</button>:null}{post.status==='approved'?<button className="primary" disabled={busy||post.render_stale} onClick={()=>void run({action:'posted'})}>Mark as posted</button>:null}{post.status!=='posted'?<button disabled={busy} onClick={()=>setEditing(true)}>{post.status==='rejected'?'Edit & resubmit':'Edit'}</button>:null}{post.status==='proposed'||post.status==='approved'?<button className="reject-button" disabled={busy} onClick={()=>setRejecting(true)}>Reject</button>:null}{post.status==='posted'?<span className="posted-label">Marked as posted ✓</span>:null}</div>:null}
 </article>;
}
