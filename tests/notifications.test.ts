import {test,expect,vi} from 'vitest';
const {updates}=vi.hoisted(()=>({updates:[]as any[]}));
vi.mock('../pipeline/db/client.js',()=>({adminClient:()=>({from:(table:string)=>table==='notification_recipients'?{select:()=>({eq:async()=>({data:[{id:'recipient',email:'test@example.com'}]})})}:{insert:()=>({select:()=>({single:async()=>({data:{id:'delivery'}})})}),update:(values:any)=>{updates.push(values);return{eq:async()=>({error:null})};}}})}));
import {notify} from '../pipeline/notifications.js';
test('provider failure is recorded without failing the job',async()=>{
 vi.stubEnv('INBOX_URL','https://example.com');vi.stubEnv('RESEND_FROM','intern@example.com');vi.stubEnv('RESEND_API_KEY','test');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('network unavailable')));const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});
 await expect(notify('learning_report','job','Learning ready','Evidence summary')).resolves.toBeUndefined();expect(updates).toContainEqual({status:'failed',error:'Delivery failed; job continued.'});warn.mockRestore();vi.unstubAllGlobals();vi.unstubAllEnvs();
});
