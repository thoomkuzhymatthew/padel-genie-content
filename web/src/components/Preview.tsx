import { useRef, useState, type ComponentType } from 'react';
import type { Post } from '../lib/types';
type Props={post:Post};
function ImageViewer({post}:Props){return <div className="image-viewer"><img src={post.asset_paths[0]} alt={post.story} loading="lazy" width="1080" height="1350"/></div>;}
function CarouselViewer({post}:Props){
 const ref=useRef<HTMLDivElement>(null);const[index,setIndex]=useState(0);
 const go=(next:number)=>{const node=ref.current;if(node)node.scrollTo({left:node.clientWidth*next,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 return <><div className="carousel-viewer" ref={ref} role="region" aria-label="Carousel preview" tabIndex={0}
 onScroll={()=>{const node=ref.current;if(node)setIndex(Math.round(node.scrollLeft/node.clientWidth));}}
 onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(Math.min(post.asset_paths.length-1,Math.max(0,index+(event.key==='ArrowRight'?1:-1))));}}}>
 {post.asset_paths.map((src,i)=><img key={src} src={src} alt={`${post.story} · slide ${i+1} of ${post.asset_paths.length}`} loading="lazy" width="1080" height="1350"/>)}</div>
 <div className="carousel-controls"><button type="button" aria-label="Previous slide" disabled={index===0} onClick={()=>go(index-1)}>←</button><div className="dots">{post.asset_paths.map((_,i)=><button type="button" key={i} aria-label={`Go to slide ${i+1}`} aria-current={i===index?'step':undefined} onClick={()=>go(i)}><i/></button>)}</div><span className="slide-counter" aria-live="polite">{index+1} / {post.asset_paths.length}</span><button type="button" aria-label="Next slide" disabled={index===post.asset_paths.length-1} onClick={()=>go(index+1)}>→</button></div></>;
}
export function VideoViewer({post}:Props){return <div className="video-viewer"><video src={post.asset_paths[0]} aria-label={post.story} controls loop muted playsInline preload="metadata"/></div>;}
// Add a viewer here when a new native format is introduced.
export const previewViewers:Record<string,ComponentType<Props>>={stat:ImageViewer,image:ImageViewer,'ranked-bars':ImageViewer,comparison:ImageViewer,carousel:CarouselViewer,video:VideoViewer};
export function Preview({post}:Props){
 const[copyMessage,setCopyMessage]=useState('Copy re-render command');
 const Viewer=previewViewers[post.format];
 if(post.render_stale)return <div className="stale-preview"><span className="stale-icon">↻</span><h3>Artwork needs refreshing</h3><p>Your text is saved. A fresh local render is needed before this draft can be approved.</p><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(`npm run render -- --post ${post.id}`);setCopyMessage('Command copied');}catch{setCopyMessage('See the re-render steps in the README');}}}>{copyMessage}</button></div>;
 return Viewer?<Viewer post={post}/>:<div className="stale-preview"><p>A preview isn’t available for this format yet.</p></div>;
}
