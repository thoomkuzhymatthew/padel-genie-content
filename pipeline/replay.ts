import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {adminClient} from './db/client.js';
import {projectRoot} from './env.js';
import {writeDraft} from './write.js';
import {renderDraft} from './render.js';
import {ideateRun} from './ideate.js';
export async function replay(runId:string,current:string,proposed:string,posts:any[]){
 const root=join(projectRoot,'runs/learning',runId,'replay');await mkdir(root,{recursive:true});const pairs:any[]=[];
 // Replay one existing selected story per distinct source, with both complete ideation catalogues retained.
 const sources=[...new Set(posts.map(p=>p.source_url))];
 for(const [index,url]of sources.entries()){
  const seed=posts.find(p=>p.source_url===url&&p.template==='stat-card')||posts.find(p=>p.source_url===url);const pair:any={source_title:seed.source_title,source_url:url,story:seed.story};
  for(const [side,playbook]of [['current',current],['proposed',proposed]]){
   if(side==='proposed'&&current===proposed){pair.proposed={...pair.current,reused_unchanged_control:true};continue;}
   const folder=join(root,String(index),side);await mkdir(folder,{recursive:true});
   for(const name of ['source.json','atoms.verified.json'])await writeFile(join(folder,name),await readFile(join(projectRoot,seed.trace.source_bundle,name)));
   await ideateRun(folder,playbook);
   const ideas=JSON.parse(await readFile(join(folder,'ideas.json'),'utf8'));
   const input=join(folder,'seed.json'),output=join(folder,'draft.json');
   await writeFile(input,JSON.stringify({id:`replay-${runId}-${index}-${side}`,template:seed.template,source_bundle:seed.trace.source_bundle,atoms:seed.trace.atoms.map((a:any)=>a.id),content:seed.content,caption:seed.caption}));
   await writeDraft(input,output,{playbook});
   const trace=await renderDraft(output,{outputSubdir:`learning/${runId}`});const draft=JSON.parse(await readFile(output,'utf8'));
   pair[side]={...seed,...draft,asset_paths:trace.assets,trace:{...seed.trace,render:trace},ideas,playbook_sha256:trace.playbook_sha256};
  }
  pairs.push(pair);
 }
 return pairs;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const id=process.argv[2];if(!id)throw Error('Usage: npm run replay -- <learning-run-uuid>');const db=adminClient();const r=await db.from('learning_runs').select('*').eq('id',id).single();if(r.error)throw Error('Run not found');
 const current=await readFile(join(projectRoot,'playbook/playbook.md'),'utf8');const proposed=await readFile(join(projectRoot,'runs/learning',id,'proposed.md'),'utf8');
 const p=await db.from('posts').select('*');const pairs=await replay(id,current,proposed,p.data||[]);await db.from('learning_runs').update({replays:pairs}).eq('id',id);
}
