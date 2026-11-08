import type { Page } from 'playwright';
/** Measure text and structural dividers; decoration/intentional chart overlays are excluded. */
export async function checkLayout(page: Page) {
 return page.evaluate(() => {
  const failures:string[]=[];
  const selectors='h1,.hero,.context,.comparison,.hold-back,.source,.row-label,.bar-value,.metric-label,.slide-body,.slide-note,.unit,.chart-context,.wordmark,.edition,.issue,.periods,.primary-pair,.secondary-pair,.legend,.carousel-navigation,.divider';
  const textElements=[...document.body.querySelectorAll<HTMLElement>('*')].filter(el=>[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent?.trim()));
  const elements=[...new Set([...document.querySelectorAll<HTMLElement>(selectors),...textElements])];
  const boxes=elements.map(el=>({el,box:el.getBoundingClientRect(),name:el.className||el.tagName}));
  for(const{el,box,name}of boxes){
   const region=el.closest('section,footer,header')?.getBoundingClientRect();
   if(box.left<60||box.right>1020||box.top<24||box.bottom>1326)failures.push('minimum margin: '+name);
   if(el.scrollWidth>el.clientWidth+1)failures.push('overflow: '+name);
   if(region&&(box.top<region.top+12||box.bottom>region.bottom-12))failures.push('region clearance: '+name);
   if([...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent?.trim())&&parseFloat(getComputedStyle(el).fontSize)<20)failures.push('minimum text size: '+name);
  }
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i],b=boxes[j];if(a.el.contains(b.el)||b.el.contains(a.el))continue;
   if(Math.min(a.box.right,b.box.right)-Math.max(a.box.left,b.box.left)>1&&Math.min(a.box.bottom,b.box.bottom)-Math.max(a.box.top,b.box.top)>1)failures.push('collision: '+a.name+' / '+b.name);
  }
  const fonts_ready=document.fonts.check('600 100px Bricolage')&&document.fonts.check('400 30px Inter');
  return {fonts_ready,failures,minimum_margin:60,minimum_text_size:20,checked_elements:boxes.length};
 });
}
export function assertLayout(checks:{fonts_ready:boolean;failures:string[]}){
 if(!checks.fonts_ready||checks.failures.length)throw new Error('Render layout/font checks failed: '+JSON.stringify(checks));
}
