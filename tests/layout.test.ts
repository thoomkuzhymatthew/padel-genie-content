import {test,expect} from 'vitest';
import {chromium} from 'playwright';
import {checkLayout,assertLayout} from '../pipeline/layout.js';
test('rejects divider/title intersections, overflow, unsafe margins and tiny text',async()=>{
 const browser=await chromium.launch();try{const page=await browser.newPage({viewport:{width:1080,height:1350}});
 await page.setContent(`<style>body{margin:0}header{height:140px;border-bottom:2px solid}section{height:600px}h1{position:absolute;left:72px;top:120px;margin:0;font-size:60px}.context{position:absolute;left:0;top:300px;width:60px;font-size:12px;white-space:nowrap}.divider{position:absolute;left:72px;top:140px;width:300px;height:4px}</style><header></header><section><h1>July looked quiet</h1><p class="context">A very long overflowing text label</p><div class="divider"></div></section>`);
 const checks=await checkLayout(page);expect(checks.failures).toEqual(expect.arrayContaining([expect.stringContaining('collision:'),expect.stringContaining('minimum margin:'),expect.stringContaining('minimum text size:'),expect.stringContaining('overflow:')]));expect(()=>assertLayout(checks)).toThrow();
 }finally{await browser.close();}
},15000);
