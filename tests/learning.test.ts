import {test,expect,vi} from 'vitest';
import {proposePlaybook,LOCK,engagementAllowed} from '../pipeline/learning/guards.js';
import {mock} from '../pipeline/metrics/mock.js';
const playbook='# Playbook\nShort hooks.\n'+LOCK+'\nNever invent.\n';
test('editorial changes retain exact locked bytes',()=>{const next=proposePlaybook(playbook,[{before:'Short hooks.',after:'Short, named hooks.',event_ids:['a'],rationale:'explicit preference'}],new Set(['a']));expect(next.split(LOCK)[1]).toBe(playbook.split(LOCK)[1]);});
test('layout and unsupported suggestions cannot become editorial rules',()=>{expect(()=>proposePlaybook(playbook,[{before:'Short hooks.',after:'More padding.',event_ids:['layout'],rationale:'overlap'}],new Set())).toThrow();expect(()=>proposePlaybook(playbook,[{before:'Never invent.',after:'Invent.',event_ids:['a'],rationale:'bad'}],new Set(['a']))).toThrow();});
test('engagement needs configurable sample size',()=>{expect(engagementAllowed(19)).toBe(false);expect(engagementAllowed(20)).toBe(true);expect(engagementAllowed(20,30)).toBe(false);});
test('mock metrics are deterministic, marked mock and only for posted posts',async()=>{const posts=[{id:'a',format:'stat',status:'posted'},{id:'b',format:'carousel',status:'approved'}];const a=await mock.fetchMetrics(posts,'2026-11-01');expect(a).toEqual(await mock.fetchMetrics(posts,'2026-11-01'));expect(a).toHaveLength(1);expect(a[0].is_mock).toBe(true);});
test('missing notification credentials/database cannot fail a job',async()=>{const {notify}=await import('../pipeline/notifications.js');const saved=process.env.SUPABASE_SECRET_KEY;process.env.SUPABASE_SECRET_KEY='';const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});await expect(notify('new_drafts','failure-check','Test','Test')).resolves.toBeUndefined();process.env.SUPABASE_SECRET_KEY=saved;warn.mockRestore();});

import {periodPosts} from '../pipeline/learning/period.js';
test('replay includes this period’s sources and reviewed older posts only',()=>{
 const posts=[{id:'old',created_at:'2026-09-01'},{id:'reviewed',created_at:'2026-09-01'},{id:'new',created_at:'2026-11-07'}];
 expect(periodPosts(posts,[{post_id:'reviewed'}],'2026-11-01').map(p=>p.id)).toEqual(['reviewed','new']);
});
