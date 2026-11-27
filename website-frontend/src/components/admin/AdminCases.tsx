"use client";
import {useEffect,useRef,useState} from "react";
import {adminApi,useAuthToken,trustApi} from "@/components/shell/backend";
import {errorMessage,Notice,PageHeader} from "./ui";
import AdminRewardReviews from './AdminRewardReviews';
type Row={id?:string;jobId?:string;reviewId?:string;reportId?:string;disputeId?:string;version?:number;status?:string;moderationStatus?:string;description?:string;reason?:string;title?:string;assigneeId?:string;assignedAdminId?:string;caseType?:string;job?:Row;moderationHidden?:boolean};
const idOf=(row:Row)=>row.disputeId??row.reportId??row.reviewId??row.jobId??row.id??row.job?.jobId??row.job?.id??"";
type Props={section:"jobs"|"reviews"|"reports"|"disputes"};
export default function AdminCases(props:Props){const token=useAuthToken();return <AdminCasesContent key={(token??'guest')+props.section} {...props}/>;}
function AdminCasesContent({section}:Props){
 const token=useAuthToken();const [rows,setRows]=useState<Row[]>([]),[selected,setSelected]=useState<Row|null>(null);
 const [page,setPage]=useState(0),[pages,setPages]=useState(1),[status,setStatus]=useState(""),[reload,setReload]=useState(0);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),[reason,setReason]=useState(""),[evidence,setEvidence]=useState("");
 const [decision,setDecision]=useState<{decisionId:string;operation:string;paymentStatus:string;orderStatus:string;timerStatus:string;executionStatus:string;lastError?:string;terminalConflict?:boolean;version:number}|null>(null);
 const [operation,setOperation]=useState("REJECT"),[branch,setBranch]=useState("NONE"),[cash,setCash]=useState(false),[received,setReceived]=useState(false),[amount,setAmount]=useState("");
 const [fault,setFault]=useState("NONE"),[cycles,setCycles]=useState("1"),[supersedes,setSupersedes]=useState(""),[serious,setSerious]=useState(false),[workAccepted,setWorkAccepted]=useState(false);
 const [files,setFiles]=useState<{id:string;originalName:string;status:string}[]>([]);
 const faultValid=fault==='CORRECTION'?operation==='REJECT'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supersedes.trim()):fault==='LATE'?Number.isInteger(Number(cycles))&&Number(cycles)>=1&&Number(cycles)<=6&&branch!=='CLIENT':['ABANDONMENT','CAPABILITY'].includes(fault)?branch==='PROVIDER'&&['REFUND','SUPPORT'].includes(operation):true;
 const flight=useRef(false);
 useEffect(()=>{let active=true;
  adminApi.listCases(section,{page,size:20,...(status?{status}:{})}).then((r:{result?:{content?:Row[];data?:Row[];totalPages?:number}})=>{
   if(!active)return;const data=r.result?.content??r.result?.data;if(!Array.isArray(data))throw new Error("Invalid case page");setSelected(null);setDecision(null);setError("");setRows(data);setPages(r.result?.totalPages??1);
  }).catch((e:unknown)=>{if(active)setError(errorMessage(e));});return()=>{active=false;};
 },[section,page,status,reload,token]);
 async function select(row:Row){if(flight.current)return;flight.current=true;setBusy(true);setError("");setDecision(null);setSelected(null);setReason("");setEvidence("");setOperation("REJECT");setBranch("NONE");setCash(false);setReceived(false);setAmount("");setFault("NONE");setCycles("1");setSupersedes("");setSerious(false);setWorkAccepted(false);setFiles([]);try{
  const r=await adminApi.getCase(section,idOf(row));if(!r?.result)throw new Error("Invalid case detail");setSelected(r.result);
  if(section==='disputes'){try{const d=await adminApi.getCaseDecision(idOf(row));setDecision(d?.result??null);}catch(e){if((e as {status?:number}).status!==404)throw e;}}
 }catch(e){setError(errorMessage(e));}finally{flight.current=false;setBusy(false);}}
 async function action(name:string,extra:Record<string,unknown>={}){
  if(!selected||flight.current||!reason.trim())return;flight.current=true;setBusy(true);setError("");
  try{const res=await adminApi.caseAction(section,idOf(selected),name,{reason:reason.trim(),expectedVersion:selected.version,...extra});
   if(!res?.result)throw new Error("Missing server acknowledgement; reload before retry");setReload(n=>n+1);
  }catch(e){setError(errorMessage(e)+" — Reload để đối chiếu trạng thái server trước khi thử lại.");}finally{flight.current=false;setBusy(false);}
 }
 return <section><PageHeader title={`Quản lý ${section}`}/>{section==='reviews'&&<AdminRewardReviews/>}{error&&<Notice tone="error">{error}</Notice>}
 <label>Trạng thái <input value={status} onChange={e=>{setStatus(e.target.value);setPage(0);}}/></label>
 <button disabled={busy} onClick={()=>setReload(n=>n+1)}>Tải lại</button>
 <table><thead><tr><th>Hồ sơ</th><th>Trạng thái</th><th>Phụ trách</th><th/></tr></thead><tbody>{rows.map(r=><tr key={idOf(r)}><td>{r.title??r.job?.title??idOf(r)}</td><td>{r.status??r.moderationStatus??r.job?.status}</td><td>{r.assignedAdminId??r.assigneeId??"—"}</td><td><button disabled={busy} onClick={()=>select(r)}>Chi tiết</button></td></tr>)}</tbody></table>
 {!rows.length&&!error&&<p>Không có hồ sơ trong bộ lọc.</p>}
 <button disabled={page===0||busy} onClick={()=>setPage(n=>n-1)}>Trước</button> {page+1}/{Math.max(1,pages)} <button disabled={page+1>=pages||busy} onClick={()=>setPage(n=>n+1)}>Sau</button>
 {selected&&<article><h2>{idOf(selected)}</h2><p>{selected.description??selected.reason??selected.job?.title}</p><p>Version: {selected.version} · Phụ trách: {selected.assignedAdminId??selected.assigneeId??"Chưa nhận"}</p>
 <label>Lý do bắt buộc <textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000}/></label>
 {section==='jobs'&&<><button disabled={busy||!reason.trim()} onClick={()=>action('moderation',{hidden:true})}>Ẩn Job</button><button disabled={busy||!reason.trim()} onClick={()=>action('moderation',{hidden:false})}>Gỡ ẩn</button></>}
 {section==='reviews'&&<><button disabled={busy||!reason.trim()} onClick={()=>action('moderation',{status:'APPROVED'})}>APPROVED</button><button disabled={busy||!reason.trim()} onClick={()=>action('moderation',{status:'REJECTED'})}>REJECTED</button><button disabled={busy||!reason.trim()} onClick={()=>action('moderation',{status:'HIDDEN'})}>HIDDEN</button></>}
 {section==='reports'&&<><button disabled={busy||!reason.trim()} onClick={()=>action('status',{status:'REVIEWING'})}>REVIEWING</button><button disabled={busy||!reason.trim()} onClick={()=>action('status',{status:'RESOLVED'})}>RESOLVED</button><button disabled={busy||!reason.trim()} onClick={()=>action('status',{status:'REJECTED'})}>REJECTED</button></>}
 {section==='disputes'&&<><button disabled={busy||!reason.trim()} onClick={()=>action('take-over')}>Nhận hồ sơ</button><button disabled={busy||!reason.trim()} onClick={()=>action('evidence-request')}>Yêu cầu chứng cứ</button>
 <button disabled={busy} onClick={async()=>{if(flight.current)return;flight.current=true;setBusy(true);try{const response=await trustApi.listEvidence(idOf(selected));if(!Array.isArray(response?.result))throw new Error('Invalid evidence list');setFiles(response.result);}catch(e){setError(errorMessage(e));}finally{flight.current=false;setBusy(false);}}}>Danh sách chứng cứ</button>
 {files.map(file=><p key={file.id}>{file.originalName} · {file.status}<button disabled={busy||file.status!=='READY'} onClick={async()=>{if(flight.current)return;flight.current=true;setBusy(true);try{const blob=await trustApi.downloadEvidence(file.id);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=file.originalName;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(errorMessage(e));}finally{flight.current=false;setBusy(false);}}}>Tải chứng cứ</button></p>)}
 <label>Tổng hợp chứng cứ <textarea value={evidence} onChange={e=>setEvidence(e.target.value)} maxLength={2000}/></label>
 <label>Kết luận <select value={operation} onChange={e=>setOperation(e.target.value)}>{(['POST_PAYMENT','CASH_PAYMENT'].includes(selected.caseType??'')?['REJECT','SUPPORT']:['REJECT','RELEASE','REFUND']).map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Bên chịu trách nhiệm theo kết luận <select value={branch} onChange={e=>setBranch(e.target.value)}>{['NONE','CLIENT','PROVIDER'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Lỗi được kết luận riêng <select value={fault} onChange={e=>{setFault(e.target.value);if(e.target.value==='CORRECTION')setOperation('REJECT');}}>{['NONE','LATE','ABANDONMENT','CAPABILITY','CORRECTION'].map(v=><option key={v}>{v}</option>)}</select></label>
 {fault==='LATE'&&<label>Số chu kỳ trễ đã xác minh <input type="number" min={1} max={6} step={1} value={cycles} onChange={e=>setCycles(e.target.value)}/></label>}
 {fault==='CORRECTION'&&<><label>ID kết luận cần sửa <input value={supersedes} onChange={e=>setSupersedes(e.target.value)}/></label><label><input type="checkbox" checked={serious} onChange={e=>setSerious(e.target.checked)}/>Chứng cứ sai nghiêm trọng (ngoại lệ sau 7 ngày, phải giải trình)</label><p>ADMIN độc lập xem xét; chỉ bù nguồn phạt của kết luận được thay thế, không chuyển lại tiền đã giải ngân.</p></>}
 <label><input type="checkbox" checked={cash} onChange={e=>setCash(e.target.checked)}/>ONSITE CASH</label>
 {cash&&<><label><input type="checkbox" checked={workAccepted} onChange={e=>setWorkAccepted(e.target.checked)}/>Đã xác minh nghiệm thu công việc</label><label><input type="checkbox" checked={received} onChange={e=>setReceived(e.target.checked)}/>Đã xác minh có nhận tiền</label><label>Số tiền thực nhận <input inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value)}/></label></>}
 <button disabled={busy||!reason.trim()||!evidence.trim()||Boolean(decision)||!faultValid||(cash&&(!amount.trim()||!Number.isSafeInteger(Number(amount))||Number(amount)<0))} onClick={()=>action('resolve',{operation,branch,evidenceSummary:evidence,faultType:fault,lateCycles:fault==='LATE'?Number(cycles):0,...(fault==='CORRECTION'?{supersedesDecisionId:supersedes.trim(),seriousEvidenceError:serious}:{}),...(cash?{cash:{workAccepted,paymentReceived:received,actualReceivedAmount:Number(amount)}}:{})})}>Ghi kết luận</button>
 {decision&&<div><p>Kết luận: {decision.operation} · Tiền: {decision.paymentStatus} · Order: {decision.orderStatus} · Timer: {decision.timerStatus} · Thực thi: {decision.executionStatus}</p><p>{decision.lastError}</p><button disabled={busy||!reason.trim()||decision.terminalConflict||decision.executionStatus!=='NEEDS_RECONCILIATION'} onClick={async()=>{if(flight.current)return;flight.current=true;setBusy(true);try{await adminApi.retryDecision(decision.decisionId,{reason,expectedVersion:decision.version});setReload(n=>n+1);}catch(e){setError(errorMessage(e));}finally{flight.current=false;setBusy(false);}}}>Thử lại bước an toàn</button></div>}
 </>}
 </article>}</section>;
}
