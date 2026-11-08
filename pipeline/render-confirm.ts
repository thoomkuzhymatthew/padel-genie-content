import {parseArgs} from 'node:util';
import {confirmQueuedRender} from './render-post.js';
const{values}=parseArgs({options:{post:{type:'string'}},strict:true});
if(!values.post)throw new Error('Usage: npm run render:confirm -- --post <id>');
await confirmQueuedRender(values.post);
