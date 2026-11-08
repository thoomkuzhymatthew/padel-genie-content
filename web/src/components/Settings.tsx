import {useEffect,useState,type FormEvent} from 'react';
import {supabase} from '../lib/supabase';
type Recipient={id:string;email:string;notify_new_drafts:boolean;notify_learning_report:boolean;notify_replay_ready:boolean};
const types=[['notify_new_drafts','New drafts ready'],['notify_learning_report','Learning report ready'],['notify_replay_ready','Replay ready']]as const;
export function Settings(){
 const[recipients,setRecipients]=useState<Recipient[]>([]),[email,setEmail]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const r=await supabase.from('notification_recipients').select('*').order('created_at');if(r.error)setError('Could not load recipients.');else setRecipients(r.data||[]);}
 useEffect(()=>{void load();},[]);
 async function save(operation:()=>PromiseLike<{error:unknown}>){setBusy(true);setError('');try{const r=await operation();if(r.error)throw Error('Could not save notification preferences.');await load();}catch(e){setError(e instanceof Error?e.message:'Could not save.');}finally{setBusy(false);}}
 async function add(event:FormEvent){event.preventDefault();await save(()=>supabase.from('notification_recipients').insert({email:email.trim().toLowerCase()}));setEmail('');}
 return <section className="workspace-page"><h1>Keep me in the loop.</h1><p>Choose who hears from the intern, and when.</p><p className="helper">For this trial, Resend delivery is limited to Matthew’s Resend account address until a sending domain is verified.</p>{error?<p role="alert">{error}</p>:null}<form className="recipient-form" onSubmit={event=>void add(event)}><label>Notification email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button disabled={busy} className="primary">Add recipient</button></form>{recipients.map(recipient=><article className="recipient" key={recipient.id}><strong>{recipient.email}</strong>{types.map(([key,label])=><label className="toggle" key={key}><input type="checkbox" checked={recipient[key]} disabled={busy} onChange={()=>void save(()=>supabase.from('notification_recipients').update({[key]:!recipient[key]}).eq('id',recipient.id))}/>{label}</label>)}<button disabled={busy} onClick={()=>void save(()=>supabase.from('notification_recipients').delete().eq('id',recipient.id))}>Remove recipient</button></article>)}</section>;
}
