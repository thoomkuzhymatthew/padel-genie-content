import {adminClient} from './db/client.js';
import {notify} from './notifications.js';
const id=process.argv[2];if(!/^[a-f0-9-]{36}$/.test(id||''))throw Error('Specify a learning run UUID');
const db=adminClient();const run=await db.from('learning_runs').select('report,pr_url,replays').eq('id',id).single();
if(run.error||!run.data.report||!run.data.pr_url)throw Error('Learning report and PR must exist before retrying notifications');
const findings=run.data.report.split('## Feedback\n')[1]?.split('## Routing')[0].split('\n').filter((line:string)=>line.startsWith('- ')).slice(0,3).map((line:string)=>line.replace(/ \(events:.*$/,'').slice(2)).join(' ')||'Your evidence-backed learning report and proposal are ready.';
await notify('learning_report',id,'Here’s what I learned this week.',findings);
if(run.data.replays?.length)await notify('replay_ready',id,'Your replay comparison is ready.','Review the current and proposed playbooks side by side. Unchanged playbooks share the same control draft.');
const result=await db.from('notification_deliveries').select('type,status').like('dedupe_key',id+':%');console.log(JSON.stringify(result.data));
