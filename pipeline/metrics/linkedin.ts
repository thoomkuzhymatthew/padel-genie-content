import type {MetricsAdapter} from './adapter.js';
/** TODO: authorised platform analytics or reviewer-supplied CSV import; never fabricate live metrics. */
export const adapter:MetricsAdapter={async fetchMetrics(){throw new Error('Live metrics adapter is not configured');}};
