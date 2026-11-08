import type{ReactNode}from'react';
export type ReportEvidence={events?:{type:string}[];engagement?:Record<string,{posted_count:number;eligible:boolean;conclusion:string}>};
export function reportSections(report:string){return report.split(/^## /m).slice(1).map(part=>{const [title,...lines]=part.split('\n');return{title:title.trim(),body:lines.join('\n').trim()};});}
function inline(text:string):ReactNode[]{return text.split(/(\*\*[^*]+\*\*)/g).map((part,index)=>part.startsWith('**')?<strong key={index}>{part.slice(2,-2)}</strong>:part);}
function Prose({text}:{text:string}){
 const readable=text.replace(/\s*\(events?:?\s+[a-f0-9][a-f0-9,\s-]*\)/gi,'');
 return <div className="report-prose">{readable.split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=>paragraph.startsWith('- ')?<ul key={index}>{paragraph.split(/\n(?=- )/).map((line,i)=><li key={i}>{inline(line.replace(/^- /,''))}</li>)}</ul>:<p key={index}>{inline(paragraph)}</p>)}</div>;
}
export function LearningReport({report,evidence}:{report:string;evidence?:ReportEvidence}){
 const sections=reportSections(report);const counts=evidence?.events;const formats=evidence?.engagement;
 return <div className="learning-report">
 {counts?<div className="report-stats" role="group" aria-label="Review activity">{[['approve','Approvals'],['edit','Edits'],['reject','Rejections']].map(([type,label])=><div key={type}><strong>{counts.filter(event=>event.type===type).length}</strong><span>{label}</span></div>)}</div>:null}
 {sections.length?sections.map(section=><section className="report-section" key={section.title}><h3>{section.title==='Routing'?'How feedback was handled':section.title==='Metrics'?'Performance evidence':section.title==='Feedback'?'What the feedback tells us':section.title}</h3>{section.title==='Metrics'&&formats?<><p className="section-note">Mock metrics · demonstration data only</p><div className="metric-list">{Object.entries(formats).map(([format,value])=><div className="metric-line" key={format}><span>{({stat:'Stat cards',carousel:'Carousels','ranked-bars':'Ranked bars',comparison:'Comparisons'} as Record<string,string>)[format]||format}</span><span>{value.posted_count} posted</span><span className="metric-status">{value.eligible?'Mock data only':'Not enough data yet'}</span></div>)}</div><p className="section-note">Mock data does not establish real performance.</p></>:<Prose text={section.body}/>}</section>):<Prose text={report}/>}
 <details className="technical-details"><summary>Original report and evidence references</summary><pre className="report-copy report-original">{report}</pre></details>
 </div>;
}
