// services/alertsEngine.js
import { getEngineState, saveEngineState } from "./engineState.js";

export function processAlerts(alerts) {
  const st = getEngineState();
  const buckets = { published:[], toValidate:[], expert:[], pending:[], ignored:[] };

  for (const a of alerts) {
    if (a.confidence >= 90) buckets.published.push(a);
    else if (a.confidence >= 70) buckets.toValidate.push(a);
    else buckets.ignored.push(a);
  }

  const newState = {
    ...st,
    alertsList: [...(st.alertsList||[]), ...alerts],
    alertsBuckets: {
      published:[...(st.alertsBuckets?.published||[]),...buckets.published],
      toValidate:[...(st.alertsBuckets?.toValidate||[]),...buckets.toValidate],
      expert:st.alertsBuckets?.expert||[],
      pending:[...(st.alertsBuckets?.pending||[]),...buckets.pending],
      ignored:[...(st.alertsBuckets?.ignored||[]),...buckets.ignored],
    }
  };

  saveEngineState(newState);
  return newState.alertsBuckets;
}
