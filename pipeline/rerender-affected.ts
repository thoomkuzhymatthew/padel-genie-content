import {adminClient} from './db/client.js';
import {renderQueuedPost} from './render-post.js';
import {renderDraft} from './render.js';
const template=process.argv[2];if(!['stat-card','ranked-bars'].includes(template))throw Error('Specify the changed template');
const db=adminClient();const result=await db.from('posts').select('*').eq('template',template);if(result.error)throw Error('Could not read affected posts');
for(const post of result.data){
 const r=await db.from('posts').update({content_version:post.content_version+1,version:post.version+1,status:post.status==='approved'?'proposed':post.status,trace:{...post.trace,layout_fix:'Milestone 6: collision, margins and title clearance checks'}}).eq('id',post.id).eq('version',post.version).select('id').single();if(r.error)throw Error('Affected post changed concurrently');
 await renderQueuedPost(post.id,renderDraft);
}
