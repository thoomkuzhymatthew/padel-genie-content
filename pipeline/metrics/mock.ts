import {createHash} from 'node:crypto';
import type {MetricsAdapter} from './adapter.js';
export const mock:MetricsAdapter={async fetchMetrics(posts,since){return posts.filter(p=>p.status==='posted').map(p=>{
 const seed=createHash('sha256').update(p.id).digest().readUInt32BE(0);const scale=p.format==='carousel'?2:1;const impressions=1000+seed%4000;
 return{post_id:p.id,date:since.slice(0,10),platform:'mock',impressions,likes:(20+seed%60)*scale,comments:seed%15,shares:(3+seed%12)*scale,saves:(5+seed%20)*scale,clicks:seed%30,is_mock:true};
});}};
