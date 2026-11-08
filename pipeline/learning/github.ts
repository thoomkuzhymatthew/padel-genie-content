import {execFileSync} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {projectRoot,requireEnv} from '../env.js';
export async function github(path:string,method='GET',body?:unknown){
 const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN||requireEnv('GITHUB_DISPATCH_TOKEN');
 const response=await fetch('https://api.github.com/repos/thoomkuzhymatthew/padel-genie-content'+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('GitHub request failed: HTTP '+response.status);return response.status===204?null:response.json();
}
export function git(...args:string[]){return execFileSync('git',args,{cwd:projectRoot,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
export async function openProposal(id:string,currentCommit:string,proposed:string,report:string){
 const branch='learning/'+id;
 await github('/git/refs','POST',{ref:'refs/heads/'+branch,sha:currentCommit});
 // Git data API writes only the declared proposal paths, never generated model paths.
 const base=await github('/git/commits/'+currentCommit);
 const tree=await github('/git/trees','POST',{base_tree:base.tree.sha,tree:[{path:'playbook/playbook.md',mode:'100644',type:'blob',content:proposed},{path:'reports/proposals/learning-'+id+'.md',mode:'100644',type:'blob',content:report}]});
 const commit=await github('/git/commits','POST',{message:'Propose evidence-backed intern learnings',tree:tree.sha,parents:[currentCommit]});
 await github('/git/refs/heads/'+branch,'PATCH',{sha:commit.sha});
 return github('/pulls','POST',{title:'Intern learning proposal '+id.slice(0,8),head:branch,base:'main',body:report+'\n\nReview the replay in the authenticated Learning tab. LOCKED rules are unchanged. This workflow never merges.'});
}
