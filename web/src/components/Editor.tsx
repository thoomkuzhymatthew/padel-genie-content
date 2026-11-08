import { useState, type FormEvent } from 'react';
import type { Content, Post } from '../lib/types';
import { editableFields, updateContent } from '../lib/content';
type Props={post:Post;busy:boolean;onCancel:()=>void;onSave:(caption:string,content:Content,note:string)=>Promise<void>};
export function Editor({post,busy,onCancel,onSave}:Props){
 const[caption,setCaption]=useState(post.caption);const[content,setContent]=useState(post.content);const[note,setNote]=useState('');
 const limits=((post.trace.template_descriptor as {fields?:{name:string;max_characters:number|null}[]}|undefined)?.fields)||[];
 const limit=(path:string)=>limits.find(field=>field.name===path.split('.').map(part=>/^\d+$/.test(part)?'[]':part).join('.').replaceAll('.[]','[]'))?.max_characters||4000;
 const save=async(event:FormEvent)=>{event.preventDefault();await onSave(caption,content,note);};
 return <form className="editor" onSubmit={save}><h3>Edit this draft</h3><label>Caption<textarea aria-label="Edit caption" rows={5} maxLength={4000} value={caption} onChange={event=>setCaption(event.target.value)}/></label>
 <details><summary>Slide &amp; card text</summary><p className="helper">Changing artwork text requires a local re-render. Source and brand fields stay fixed.</p>
 {editableFields(content).map(field=><label key={field.path}>{field.label}<textarea aria-label={`Edit ${field.path}`} rows={field.value.length>80?3:2} maxLength={limit(field.path)} value={field.value} onChange={event=>setContent(previous=>updateContent(previous,field.path,event.target.value))}/></label>)}</details>
 <label>Note for the intern <span className="optional">optional</span><textarea aria-label="Edit note" rows={2} maxLength={2000} placeholder="What should I learn from this change?" value={note} onChange={event=>setNote(event.target.value)}/></label>
 <div className="form-actions"><button className="primary" disabled={busy} type="submit">{busy?'Saving…':'Save changes'}</button><button type="button" disabled={busy} onClick={onCancel}>Cancel</button></div></form>;
}
