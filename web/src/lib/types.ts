export type Content = Record<string, unknown>;
export type Status = 'proposed'|'approved'|'posted'|'rejected';
export type Post = {
 id:string;slug:string;source_url:string;source_title:string;format:string;template:string;
 story:string;content:Content;caption:string;asset_paths:string[];trace:Content;playbook_version:string;
 status:Status;version:number;content_version:number;rendered_version:number;render_stale:boolean;created_at:string;updated_at:string;
};
export type Reviewer = {user_id:string;display_name:string};
export type PostEvent = {id:string;post_id:string;actor_id:string;type:'approve'|'edit'|'reject'|'posted';note:string|null;reason:string|null;reason_tags:string[];created_at:string;diff:unknown[]};
export const reasonTags = ['Too dense','Not interesting','Off brand','Wrong angle','Needs verification'];
