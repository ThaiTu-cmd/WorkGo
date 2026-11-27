"use client";
import {useRef,useState} from "react";
import {adminApi,trustApi,useAuthToken} from "@/components/shell/backend";
import {Notice,PageHeader,errorMessage} from "./ui";
type Sanction={id:string;scope:string;reason:string;reference:string;effectiveAt:string;expiresAt?:string;revokedAt?:string};
export default function AdminSanctions(){const token=useAuthToken();return <AdminSanctionsContent key={token??'guest'}/>;}
function AdminSanctionsContent(){
 const [provider,setProvider]=useState(''),[reason,setReason]=useState(''),[reference,setReference]=useState(''),[scope,setScope]=useState('PROVIDER');
 const [rows,setRows]=useState<Sanction[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);const flight=useRef(false);
 const [support,setSupport]=useState<Array<{id:string;contact:string;description:string;createdAt:string}>>([]);
 const [appeals,setAppeals]=useState<Array<{id:string;sanctionId:string;explanation:string;version:number;submittedAt:string}>>([]);
 async function pending(){try{const r=await adminApi.pendingSanctionAppeals();if(!Array.isArray(r?.result))throw new Error('Invalid appeal queue');setAppeals(r.result);}catch(e){setError(errorMessage(e));}}
 async function review(id:string,accepted:boolean,version:number){if(flight.current||!reason.trim())return;flight.current=true;setBusy(true);try{await adminApi.reviewSanctionAppeal(id,{accepted,reason,expectedVersion:version});await pending();}catch(e){setError(errorMessage(e));}finally{flight.current=false;setBusy(false);}}
 
 async function load(){setError('');try{const r=await trustApi.getSanctions(provider);if(!Array.isArray(r?.result))throw new Error('Invalid sanctions list');setRows(r.result);}catch(e){setError(errorMessage(e));}}
 return <section><PageHeader title="Chế tài Provider"/>{error&&<Notice tone="error">{error}</Notice>}<label>Provider ID <input value={provider} onChange={e=>setProvider(e.target.value)}/></label><button disabled={busy||!provider} onClick={load}>Tra cứu</button>
 <table><thead><tr><th>ID</th><th>Phạm vi</th><th>Lý do</th><th>Hiệu lực</th><th>Gỡ</th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td>{s.id}</td><td>{s.scope}</td><td>{s.reason}</td><td>{s.effectiveAt}</td><td>{s.revokedAt??'—'}</td></tr>)}</tbody></table>
 <h2>Hỗ trợ truy cập khi bị khóa bảo mật</h2><button disabled={busy} onClick={async()=>{try{const r=await adminApi.securitySupport();if(!Array.isArray(r?.result))throw new Error('Invalid support queue');setSupport(r.result);}catch(e){setError(errorMessage(e));}}}>Tải yêu cầu hỗ trợ</button>{support.map(s=><article key={s.id}><p>{s.id} · {s.contact} · {s.createdAt}</p><p>{s.description}</p></article>)}
 <h2>Kháng nghị</h2><button disabled={busy} onClick={pending}>Tải hàng chờ</button>{appeals.map(a=><article key={a.id}><p>{a.id} · {a.sanctionId} · {a.submittedAt}</p><p>{a.explanation}</p><button disabled={busy||!reason.trim()} onClick={()=>review(a.id,true,a.version)}>Chấp nhận</button><button disabled={busy||!reason.trim()} onClick={()=>review(a.id,false,a.version)}>Từ chối</button></article>)}
 <h2>Provider đã xác minh trước cutover</h2><p>Khởi tạo bằng sự kiện authority, không cộng thưởng lịch sử hoặc đặt lại điểm đang có.</p><button disabled={busy||!provider||!reason.trim()} onClick={async()=>{if(flight.current)return;flight.current=true;setBusy(true);try{await adminApi.initializeProviderReputation(provider,reason);await load();}catch(e){setError(errorMessage(e));}finally{flight.current=false;setBusy(false);}}}>Ghi sự kiện khởi tạo legacy</button>
 <h2>Phục hồi có giám sát</h2><p>Điểm 5–19: sau 7 ngày, đủ nghĩa vụ và quyết định SUPER_ADMIN; mỗi grant dùng cho một Order.</p>
 <button disabled={busy||!provider||!reason.trim()} onClick={async()=>{if(flight.current)return;flight.current=true;setBusy(true);try{await adminApi.approveRecovery(provider,reason);await load();}catch(e){setError(errorMessage(e));}finally{flight.current=false;setBusy(false);}}}>Mở một Order giám sát</button>
 <button disabled={busy||!provider||!reason.trim()} onClick={async()=>{if(flight.current)return;flight.current=true;setBusy(true);try{await adminApi.completeRecovery(provider,reason);await load();}catch(e){setError(errorMessage(e));}finally{flight.current=false;setBusy(false);}}}>Xét entry phục hồi sau hai CLIENT</button>
 <form onSubmit={async e=>{e.preventDefault();if(flight.current)return;flight.current=true;setBusy(true);try{const r=await adminApi.createSanction(provider,{scope,reason,reference,effectiveAt:new Date().toISOString()});if(!r?.result?.id)throw new Error('Missing sanction receipt');await load();}catch(err){setError(errorMessage(err));}finally{flight.current=false;setBusy(false);}}}>
 <label>Phạm vi <select value={scope} onChange={e=>setScope(e.target.value)}>{['PROVIDER','ACCOUNT','SECURITY'].map(s=><option key={s}>{s}</option>)}</select></label>
 <label>Hồ sơ/kết luận tham chiếu <input required value={reference} onChange={e=>setReference(e.target.value)} maxLength={200}/></label><label>Lý do <textarea required value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000}/></label><button disabled={busy||!provider||!reason.trim()||!reference.trim()}>Ghi quyết định</button></form></section>;
}
