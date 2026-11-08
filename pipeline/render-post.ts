import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { adminClient } from './db/client.js';
import { projectRoot, requireEnv } from './env.js';
import { sha256 } from './ingest.js';
type Render = (filename:string,options?:{outputSubdir?:string})=>Promise<{assets:string[];[key:string]:unknown}>;
export async function renderQueuedPost(postId:string,render:Render){
 if(!/^[a-f0-9-]{36}$/.test(postId))throw new Error('Use the post UUID from the inbox');
 const client=adminClient();const{data:post,error}=await client.from('posts').select('*').eq('id',postId).single();
 if(error)throw new Error('Could not load queued post');
 if(!post.render_stale){console.log('This post already has current artwork.');return;}
 const folder=join(projectRoot,'runs/rerenders',postId);await mkdir(folder,{recursive:true});
 const draft={id:post.slug,template:post.template,source_bundle:post.trace.source_bundle,atoms:post.trace.atoms.map((atom:{id:string})=>atom.id),content:post.content,caption:post.caption};
 const file=join(folder,'draft.json');await writeFile(file,JSON.stringify(draft,null,2)+'\n');
 const trace=await render(file,{outputSubdir:`inbox/${postId}/v${post.content_version}`});
 const hashes:Record<string,string>={};for(const asset of trace.assets)hashes[asset]=sha256((await readFile(join(projectRoot,'web/public',asset.slice(1)))).toString('base64'));
 await writeFile(join(folder,'pending.json'),JSON.stringify({post_id:postId,content_version:post.content_version,assets:trace.assets,trace,hashes},null,2)+'\n');
 console.log('New artwork saved locally. The inbox stays marked as needing a refresh until these files are deployed.');
 console.log(`Commit and push the output files, then run: npm run render:confirm -- --post ${postId}`);
}
export async function confirmQueuedRender(postId:string){
 if(!/^[a-f0-9-]{36}$/.test(postId))throw new Error('Invalid post UUID');
 const pending=JSON.parse(await readFile(join(projectRoot,'runs/rerenders',postId,'pending.json'),'utf8'));
 const origin=requireEnv('INBOX_URL');
 for(const asset of pending.assets){
  const response=await fetch(new URL(asset,origin),{cache:'no-store'});
  if(!response.ok||sha256(Buffer.from(await response.arrayBuffer()).toString('base64'))!==pending.hashes[asset])throw new Error('The new image is not deployed yet. Deploy the generated output files first.');
 }
 const{error}=await adminClient().rpc('complete_post_render',{p_post_id:postId,p_content_version:pending.content_version,p_assets:pending.assets,p_render_trace:pending.trace});
 if(error)throw new Error(error.message);
 console.log('Deployed images verified. Inbox artwork is current.');
}
