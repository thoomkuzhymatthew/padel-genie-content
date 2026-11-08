/** Replay sources created or reviewed during this report period, never unrelated historical posts. */
export function periodPosts<T extends{id:string;created_at:string}>(posts:T[],events:{post_id:string}[],since:string):T[]{
 const reviewed=new Set(events.map(event=>event.post_id));return posts.filter(post=>post.created_at>=since||reviewed.has(post.id));
}
