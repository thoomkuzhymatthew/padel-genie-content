export type MetricPost={id:string;format:string;status:string};
export type MetricRow={post_id:string;date:string;platform:string;impressions:number;likes:number;comments:number;shares:number;saves:number;clicks:number;is_mock:boolean};
export interface MetricsAdapter {fetchMetrics(posts:MetricPost[],since:string):Promise<MetricRow[]>}
