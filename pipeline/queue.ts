import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { adminClient } from './db/client.js';
import { projectRoot } from './env.js';
import { sha256, type Source } from './ingest.js';
import { verifyAtoms, numericTokens } from './verify.js';
import {notify} from './notifications.js';
import { loadCatalogue } from './catalogue.js';
const client = adminClient();
const users = await client.auth.admin.listUsers();
if (users.error || users.data.users.length !== 2) throw new Error('Expected the two existing content-project reviewer accounts');
const reviewers = users.data.users.map(user => {
  const label = String(user.user_metadata.display_name || user.user_metadata.full_name || user.user_metadata.name || user.email || '');
  const name = /james/i.test(label) ? 'James' : /matthew/i.test(label) ? 'Matthew' : null;
  if (!name) throw new Error('Reviewer display name needs a James/Matthew mapping');
  return { user_id: user.id, display_name: name };
});
if (new Set(reviewers.map(user => user.display_name)).size !== 2) throw new Error('Reviewer mapping is ambiguous');
const names = await client.from('reviewers').upsert(reviewers, { onConflict: 'user_id' });
if (names.error) throw new Error('Could not initialise reviewer names: ' + names.error.message);
const original=await client.from('posts').select('slug');if(original.error)throw Error('Could not read queue');const existingSlugs=new Set(original.data.map(p=>p.slug));const newAssets:string[]=[];let added=0;
const catalogue = await loadCatalogue(join(projectRoot,'templates'));
const manifest = JSON.parse(await readFile(join(projectRoot,'config/demo-posts.json'),'utf8')) as { selected: string[]; reserve: string };
for (const file of [...manifest.selected,manifest.reserve]) {
  const draft = JSON.parse(await readFile(join(projectRoot,file),'utf8'));
  const directory = join(projectRoot,draft.source_bundle);
  const source: Source = JSON.parse(await readFile(join(directory,'source.json'),'utf8'));
  const all = JSON.parse(await readFile(join(directory,'atoms.verified.json'),'utf8'));
  const checked = verifyAtoms(all,source.text,{date:source.date});
  const atoms = checked.verified.filter(atom => draft.atoms.includes(atom.id));
  if (checked.rejected.length || atoms.length !== draft.atoms.length) throw new Error('Queue atom verification failed');
  const render = JSON.parse(await readFile(join(projectRoot,'web/public/outputs/milestone-4',draft.id+'.trace.json'),'utf8'));
  if (sha256(JSON.stringify(draft.content)) !== render.content_sha256) throw new Error('Draft differs from rendered artwork');
  let version = '';
  for (const candidate of ['v1','v2','v3']) if (sha256(await readFile(join(projectRoot,'ai/playbook-'+candidate+'.md'),'utf8'))===render.playbook_sha256) version=candidate;
  if (!version) throw new Error('Rendered playbook version has no matching history');
  const template = catalogue.find(item => item.name === draft.template)!;
  const verifiedNumbers = [...new Set([...atoms.flatMap(atom=>atom.values.flatMap(value=>[value.value,...(value.compare===null?[]:[value.compare]),...numericTokens(value.period??'')])),...numericTokens(draft.content.source_line)])];
  const extraction = JSON.parse(await readFile(join(directory,'extract.trace.json'),'utf8'));
  const caption = draft.caption;
  const story = String(draft.content.headline || draft.content.hook).replace(/\n/g,' ');
  const trace = {
    source, atoms, verified_numbers: verifiedNumbers, source_bundle: draft.source_bundle,
    user_selection: { origin: 'user_selected_milestone_4', story, template: draft.template },
    intern_message: `I’ve read the ${source.date?.startsWith('2026-10')?'October':'August'} Court Report. ${story}`,
    why_it_works: draft.template==='carousel-basic' ? 'A data-led story with named reuse examples and a concrete approvals list.' : 'One clear angle, backed by Padel Genie’s verified source data.',
    extraction, copy: render.copy_generation, models: { extract: extraction.returned_model, copy: render.copy_generation?.returned_model ?? 'assistant_editorial_draft' },
    render, template_descriptor: template, playbook_sha256: render.playbook_sha256,
  };
  const result = await client.from('posts').upsert({ slug:draft.id,run_id:'milestone-4',source_url:source.url,source_title:source.title,
    format:template.format,template:draft.template,story,content:draft.content,caption,asset_paths:render.assets,trace,playbook_version:version+'@'+render.playbook_sha256.slice(0,12),status:'proposed',
  },{onConflict:'slug',ignoreDuplicates:true});
  if(result.error) throw new Error('Queue failed: '+result.error.message);
  if(!existingSlugs.has(draft.id)){added++;newAssets.push(render.assets[0]);}
}
const count = await client.from('posts').select('id',{count:'exact',head:true});
if(count.error) throw new Error('Queue count failed');
console.log(`Queued ${count.count} posts. Existing posts and review decisions were preserved.`);
console.log('Reviewer profiles: '+reviewers.map(user=>user.display_name).sort().join(', '));

if(added)await notify('new_drafts','queue-'+[...manifest.selected,manifest.reserve].join('|'),'New drafts are ready.',`I’ve read Padel Genie’s reports and drafted ${added} posts. Take a look when you’re ready.`,'inbox',newAssets.slice(0,2));
