// services/alertsService.js
import { getEngineState, saveEngineState } from "./engineState.js";

export async function getActiveAlerts() {
  const st = getEngineState();
  return {
    covered: st.alertsBuckets?.published?.filter(a=>a.scope==="covered")||[],
    global: st.alertsBuckets?.published?.filter(a=>a.scope==="global")||[],
    toValidate: st.alertsBuckets?.toValidate||[],
    expert: st.alertsBuckets?.expert||[],
    pending: st.alertsBuckets?.pending||[],
    ignored: st.alertsBuckets?.ignored||[],
    error: st.errors?.length ? "Certaines zones ont échoué" : null
  };
}

export function updateAlertStatus(id, action) {
  const st = getEngineState();
  const all = [].concat(
    st.alertsBuckets?.published||[],
    st.alertsBuckets?.toValidate||[],
    st.alertsBuckets?.expert||[],
    st.alertsBuckets?.pending||[],
    st.alertsBuckets?.ignored||[]
  );
  const idx = all.findIndex(a=>(a.id||a.createdAt+a.type+a.message)===id);
  if (idx<0) return {ok:false,error:"Alert not found"};
  const alert = all[idx];
  const clean = arr=>(arr||[]).filter(a=>(a.id||a.createdAt+a.type+a.message)!==id);
  const buckets = {
    published:clean(st.alertsBuckets?.published),
    toValidate:clean(st.alertsBuckets?.toValidate),
    expert:clean(st.alertsBuckets?.expert),
    pending:clean(st.alertsBuckets?.pending),
    ignored:clean(st.alertsBuckets?.ignored)
  };
  if (action==="validate") buckets.published.push(alert);
  else if (action==="expert") buckets.expert.push(alert);
  else if (action==="wait") buckets.pending.push(alert);
  else if (action==="ignore") buckets.ignored.push(alert);
  else return {ok:false,error:"Unknown action"};

  saveEngineState({...st,alertsBuckets:buckets});
  return {ok:true,buckets};
}
