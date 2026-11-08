import {test,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({status:'failed'}));
vi.mock('../pipeline/db/client.js',()=>({adminClient:()=>({from:(table:string)=>{
 if(table==='notification_recipients')return{select:()=>({eq:async()=>({data:[{id:'recipient',email:'test@example.com'}]})})};
 return{
  insert:()=>({select:()=>({single:async()=>({data:null,error:{code:'23505'}})})}),
  select:()=>({eq:()=>({maybeSingle:async()=>({data:{id:'delivery',status:state.status}})})}),
  update:(values:any)=>{const query:any={eq:()=>query,select:()=>query,maybeSingle:async()=>{if(state.status!=='failed')return{data:null};state.status=values.status;return{data:{id:'delivery'}};},then:(resolve:any)=>{state.status=values.status;resolve({error:null});}};return query;}
 };
}})}));
import {notify} from '../pipeline/notifications.js';
test('failed deliveries retry once and sent deliveries are never resent',async()=>{
 vi.stubEnv('INBOX_URL','https://example.com');vi.stubEnv('RESEND_FROM','intern@example.com');vi.stubEnv('RESEND_API_KEY','test');const send=vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'resend-id'})});vi.stubGlobal('fetch',send);
 await notify('learning_report','job','Learning ready','Summary');expect(state.status).toBe('sent');expect(send).toHaveBeenCalledTimes(1);
 await notify('learning_report','job','Learning ready','Summary');expect(send).toHaveBeenCalledTimes(1);
 vi.unstubAllGlobals();vi.unstubAllEnvs();
});
