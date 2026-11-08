export const LOCK='<!-- LOCKED: the learning loop must never edit anything below this line -->';
export function lockedPart(text:string){const start=text.indexOf(LOCK);if(start<0||text.indexOf(LOCK,start+1)>=0)throw Error('Exactly one LOCKED marker required');return text.slice(start);}
export type Suggestion={event_ids:string[];before:string;after:string;rationale:string};
export function proposePlaybook(current:string,suggestions:Suggestion[],editorialEvents:Set<string>){
 const locked=lockedPart(current);let editable=current.slice(0,current.indexOf(LOCK));
 for(const s of suggestions){if(!s.event_ids.length||s.event_ids.some(id=>!editorialEvents.has(id)))throw Error('Suggestion lacks recurring editorial evidence');
 if(!s.before||s.before.includes(LOCK)||s.after.includes(LOCK)||editable.split(s.before).length!==2)throw Error('Suggestion must replace one exact editable passage');
 editable=editable.replace(s.before,s.after);
 }
 const proposed=editable+locked;if(lockedPart(proposed)!==locked)throw Error('LOCKED section changed');return proposed;
}
export function engagementAllowed(count:number,threshold=20){return count>=threshold;}
