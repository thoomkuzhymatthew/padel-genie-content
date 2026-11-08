import type { Content } from './types';
export type EditableField = {path:string;label:string;value:string};
const fixed = new Set(['wordmark','source_line','atom_id','comparison_atom_id','hero','hook_hero','closing_hero']);
export function editableFields(content:Content):EditableField[] {
 const result:EditableField[]=[];
 const walk=(node:unknown,path:string)=>{
  if(typeof node==='string'){
   const key=path.split('.').at(-1)!;
   if(!fixed.has(key))result.push({path,label:path.replace(/content_slides\.(\d+)\./,(_,n)=>`Slide ${Number(n)+2} · `).replace(/_/g,' ').replace(/\./g,' · '),value:node});
  }else if(node && typeof node==='object')Object.entries(node).forEach(([key,value])=>walk(value,path?path+'.'+key:key));
 };
 walk(content,'');return result;
}
export function updateContent(content:Content,path:string,value:string):Content{
 const copy=structuredClone(content);const parts=path.split('.');let node:Record<string,unknown>=copy;
 for(const key of parts.slice(0,-1))node=node[key] as Record<string,unknown>;
 node[parts.at(-1)!]=value;return copy;
}
export const formatLabel=(format:string)=>({stat:'Stat card','ranked-bars':'Ranked bars',comparison:'Comparison',carousel:'Carousel',video:'Video'}[format]||format);
export const timeLabel=(value:string)=>new Date(value).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'});
