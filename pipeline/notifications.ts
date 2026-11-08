import {adminClient} from './db/client.js';
import {requireEnv} from './env.js';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
type Type='new_drafts'|'learning_report'|'replay_ready';
export async function notify(type:Type,key:string,title:string,body:string,tab='learning',images:string[]=[]){
 // Entire delivery boundary is best effort, including recipient lookup and logging.
 try{
 const db=adminClient();const recipients=await db.from('notification_recipients').select('*').eq('notify_'+type,true);if(recipients.error)throw Error('Recipient lookup failed');
 for(const recipient of recipients.data||[]){
  const dedupe=key+':'+type+':'+recipient.id;
  const claim=await db.from('notification_deliveries').insert({dedupe_key:dedupe,type,recipient_id:recipient.id,status:'sending'}).select('id').single();
  let deliveryId=claim.data?.id;
  if(claim.error){
   if(claim.error.code!=='23505')continue;
   const previous=await db.from('notification_deliveries').select('id,status').eq('dedupe_key',dedupe).maybeSingle();
   if(previous.data?.status!=='failed')continue;
   const retry=await db.from('notification_deliveries').update({status:'sending',error:null}).eq('id',previous.data.id).eq('status','failed').select('id').maybeSingle();
   deliveryId=retry.data?.id;
  }
  if(!deliveryId)continue;
  try{
   const origin=requireEnv('INBOX_URL');const link=origin+'/#'+tab;
   const html=`<body style="background:#f5f6f3;color:#0d3d2c;font-family:Arial,sans-serif;padding:24px"><div style="max-width:560px;margin:auto"><h2>Padel Genie</h2><h1>${escape(title)}</h1><p style="line-height:1.6">${escape(body)}</p>${images.map(path=>`<img alt="Draft preview" width="200" src="${escape(new URL(path,origin).href)}">`).join('')}<p><a style="background:#0d3d2c;color:#fff;padding:14px 20px;display:inline-block" href="${escape(link)}">${type==='new_drafts'?'Review drafts':'Open learning report'}</a></p><p>Your social intern · Human sign-off always.</p></div></body>`;
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+requireEnv('RESEND_API_KEY'),'Content-Type':'application/json','Idempotency-Key':dedupe},body:JSON.stringify({from:requireEnv('RESEND_FROM'),to:[recipient.email],subject:title,html}),signal:AbortSignal.timeout(15000)});
   const result=await response.json();if(!response.ok)throw Error('Resend HTTP '+response.status);
   await db.from('notification_deliveries').update({status:'sent',response_id:result.id}).eq('id',deliveryId);
  }catch(error){await db.from('notification_deliveries').update({status:'failed',error:error instanceof Error&&/^Resend HTTP \d+$/.test(error.message)?error.message:'Delivery failed; job continued.'}).eq('id',deliveryId);console.warn('Email failed; job continues.');}
 }
 }catch{console.warn('Notification unavailable; job continues.');}
}
