import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {editableFields,updateContent} from '../web/src/lib/content.js';
import {VideoViewer,previewViewers} from '../web/src/components/Preview.js';
import type{Post}from'../web/src/lib/types.js';
it('edits nested slide text immutably while keeping source/brand/data references fixed',()=>{
 const content={wordmark:'Padel Genie',source_line:'Source line',hero:'38',content_slides:[{headline:'Before',body:'Body',atom_id:'a1'}]};
 const fields=editableFields(content);expect(fields.map(field=>field.path)).toEqual(['hero','content_slides.0.headline','content_slides.0.body']);
 const next=updateContent(content,'content_slides.0.headline','After');
 expect((next.content_slides as {headline:string}[])[0].headline).toBe('After');expect(content.content_slides[0].headline).toBe('Before');
});
it('routes every current format and exposes a looping muted controlled video viewer',()=>{
 for(const name of ['stat','ranked-bars','comparison','carousel','video'])expect(previewViewers[name]).toBeDefined();
 const html=renderToStaticMarkup(createElement(VideoViewer,{post:{asset_paths:['/future-video.mp4'],story:'Future clip'}as Post}));
 expect(html).toContain('controls=""');expect(html).toContain('loop=""');expect(html).toContain('muted=""');expect(html).toContain('playsInline=""');expect(html).toContain('video-viewer');
});
