import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {adminClient} from './db/client.js';
import {requireEnv,projectRoot} from './env.js';
const origin=requireEnv('INBOX_URL'),db=adminClient(),checks:string[]=[];const check=(ok:unknown,name:string)=>{if(!ok)throw Error(name);checks.push(name);console.log('PASS '+name);};
const phase=process.argv[2]||'start';const directory=join(projectRoot,'runs/verification');await mkdir(directory,{recursive:true});
check((await fetch(origin+'/api/learn',{method:'POST'})).status===401,'learning trigger rejects anonymous access');
const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(20000);const errors:string[]=[];page.on('pageerror',()=>errors.push('runtime error'));
 await page.goto(origin);await page.getByLabel('Email',{exact:true}).fill(requireEnv('REVIEWER_TEST_EMAIL'));await page.getByLabel('Password',{exact:true}).fill(requireEnv('REVIEWER_TEST_PASSWORD'));await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Learning',exact:true}).waitFor();
 check(true,'test account reaches live Learning and Settings navigation');
 if(phase==='start'){
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  const email='verification-'+Date.now()+'@example.com';await page.getByLabel('Notification email').fill(email);await page.getByRole('button',{name:'Add recipient',exact:true}).click();
  const recipient=page.locator('.recipient').filter({hasText:email});await recipient.waitFor();await recipient.getByLabel('New drafts ready',{exact:true}).click();await page.waitForFunction(email=>{const card=[...document.querySelectorAll('.recipient')].find(el=>el.textContent?.includes(email));return card&&!(card.querySelector('input') as HTMLInputElement)?.checked;},email);
  await page.reload();await page.getByRole('heading',{name:'Keep me in the loop.'}).waitFor();check(!await recipient.getByLabel('New drafts ready',{exact:true}).isChecked(),'Settings add and per-type toggle persist');
  await recipient.getByRole('button',{name:'Remove recipient'}).click();await recipient.waitFor({state:'detached'});check(true,'Settings removes notification recipients');
  await page.getByRole('button',{name:'Learning',exact:true}).click();await page.getByRole('heading',{name:'What I’m learning.'}).waitFor();
  const response=page.waitForResponse(r=>r.url().endsWith('/api/learn')&&r.request().method()==='POST');await page.getByRole('button',{name:'Update intern',exact:true}).click();const dispatched=await response;check(dispatched.status()===202,'real Update intern click dispatches GitHub Actions');const created=await db.from('learning_runs').select('id').order('created_at',{ascending:false}).limit(1).single();const run=created.data!;await page.getByRole('status').filter({hasText:/Queued|In progress/}).waitFor();
  check(await page.getByRole('button',{name:'Update intern',exact:true}).isDisabled(),'active workflow disables duplicate trigger');
  await writeFile(join(directory,'learning-live-state.json'),JSON.stringify({id:run.id,checks},null,2));console.log('Learning run '+run.id);
 }else{
  const saved=JSON.parse(await readFile(join(directory,'learning-live-state.json'),'utf8'));const run=await db.from('learning_runs').select('*').eq('id',saved.id).single();check(run.data?.status==='done','real inbox-triggered workflow completed');
  await page.getByRole('navigation',{name:'Draft status'}).getByRole('button',{name:/Rejected/}).click();
  await page.locator('.finding strong').filter({hasText:'template/layout'}).waitFor();check(true,'original rejection displays template/layout classification');
  const corrected=page.locator('[data-post-id="db54769c-8d47-4f63-a64a-c563bbce735c"] img');await corrected.scrollIntoViewIfNeeded();await corrected.evaluate(i=>(i as HTMLImageElement).decode());check(await corrected.evaluate(i=>(i as HTMLImageElement).naturalWidth===1080),'corrected reserve image is live in its original rejected post');
  await page.getByRole('button',{name:'Learning',exact:true}).click();await page.getByRole('status').filter({hasText:/Up to date/}).waitFor();
  check(await page.getByRole('link',{name:'Review proposal PR ↗'}).getAttribute('href')===run.data.pr_url,'Learning tab links to actual proposal PR');
  check(await page.locator('.replay-pair').count()===2,'both sources have current/proposed replay drafts');
  for(const image of await page.locator('.replay-pair img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(i=>(i as HTMLImageElement).decode());check(await image.evaluate(i=>(i as HTMLImageElement).naturalWidth===1080),'live replay PNG loads at full resolution');}
  check(await page.locator('.report-original').textContent()===run.data.report,'latest report is the persisted workflow report');
  await page.screenshot({path:join(directory,'learning-live-mobile.png'),fullPage:true});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Learning view has no mobile horizontal overflow');check(errors.length===0,'no browser runtime errors');
  if(phase!=='finish-ui'){const delivery=await db.from('notification_deliveries').select('type,status').like('dedupe_key',saved.id+':%');check(delivery.data?.length===2&&delivery.data.every(d=>d.status==='sent'),'learning and replay emails accepted by Resend');}
  await writeFile(join(directory,'learning-live-result.json'),JSON.stringify({origin,id:saved.id,checks:[...saved.checks,...checks],pr_url:run.data.pr_url,email_verification_pending:phase==='finish-ui'},null,2));
 }
}catch(error){let message=error instanceof Error?error.message:'Verification failed';for(const key of ['REVIEWER_TEST_EMAIL','REVIEWER_TEST_PASSWORD','SUPABASE_SECRET_KEY','GITHUB_DISPATCH_TOKEN','RESEND_API_KEY']){const value=process.env[key];if(value)message=message.replaceAll(value,'[redacted]');}console.error(message);process.exitCode=1;}finally{await browser.close();}
