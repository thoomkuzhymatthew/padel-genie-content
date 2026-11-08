import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {adminClient} from '../db/client.js';
import {projectRoot} from '../env.js';
import {writeDraft} from '../write.js';
import {renderQueuedPost} from '../render-post.js';
import {renderDraft} from '../render.js';
export async function applyPostFeedback(findings:any[],events:any[],posts:any[]){
 const db=adminClient();const rendered:string[]=[];
 for(const post of posts){
  const local=findings.filter(f=>f.post_id===post.id&&f.category==='post-specific');if(!local.length||post.status==='posted')continue;
  const unresolved=await db.from('feedback_findings').select('*').eq('post_id',post.id).eq('category','post-specific').eq('status','pending');if(!unresolved.data?.length)continue;
  const hasAppliedText=local.every(f=>events.find(e=>e.id===f.event_id)?.diff.some((d:any)=>d.path==='caption'||d.path.startsWith('content.')));
  if(!hasAppliedText){
   const folder=join(projectRoot,'runs/feedback',post.id);await mkdir(folder,{recursive:true});const seed=join(folder,'seed.json'),output=join(folder,'draft.json');
   await writeFile(seed,JSON.stringify({id:post.slug,template:post.template,source_bundle:post.trace.source_bundle,atoms:post.trace.atoms.map((a:any)=>a.id),content:post.content,caption:post.caption}));
   await writeDraft(seed,output,{instructions:local.map(f=>f.evidence).join('\n')});const draft=JSON.parse(await readFile(output,'utf8'));
   const saved=await db.from('posts').update({content:draft.content,caption:draft.caption,content_version:post.content_version+1,version:post.version+1,status:'proposed',trace:{...post.trace,feedback_application:{event_ids:local.map(f=>f.event_id),before:{content:post.content,caption:post.caption},after:{content:draft.content,caption:draft.caption}}}}).eq('id',post.id).eq('version',post.version).select('id').single();if(saved.error)throw Error('Post changed during feedback application');
  }
  const current=await db.from('posts').select('render_stale').eq('id',post.id).single();
  if(current.data?.render_stale){await renderQueuedPost(post.id,renderDraft);rendered.push(post.id);}
  await db.from('feedback_findings').update({status:'applied',resolution:hasAppliedText?'Reviewer’s saved text edit retained.':'Applied to this post only; artwork requires deployment confirmation.'}).eq('post_id',post.id).eq('category','post-specific').eq('status','pending');
 }
 return rendered;
}
