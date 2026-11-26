"use client";
import {useEffect,useState} from "react";
import {adminApi,useAuthToken} from "@/components/webapp-bridge/backend";
import {Notice,PageHeader,errorMessage} from "./ui";
type Escrow={escrowAccountId:string;orderId:string;heldAmount:number;status:string;fundingSource:string;currency:string};
export default function AdminEscrow(){const token=useAuthToken();return <AdminEscrowContent key={token??'guest'}/>;}
function AdminEscrowContent(){const token=useAuthToken();const [rows,setRows]=useState<Escrow[]>([]),[page,setPage]=useState(0),[pages,setPages]=useState(1),[error,setError]=useState(''),[reload,setReload]=useState(0);
 useEffect(()=>{let active=true;adminApi.listEscrows(page).then((r:{result?:{content?:Escrow[];totalPages:number}})=>{if(!active)return;if(!Array.isArray(r.result?.content))throw new Error('Invalid escrow page');setRows(r.result.content);setPages(r.result.totalPages);}).catch((e:unknown)=>{if(active)setError(errorMessage(e));});return()=>{active=false;};},[page,reload,token]);
 return <section><PageHeader title="Ký quỹ — chỉ đọc"/>{error&&<Notice tone="error">{error}</Notice>}<button onClick={()=>setReload(n=>n+1)}>Tải lại</button><table><thead><tr><th>Order</th><th>Nguồn</th><th>Số tiền</th><th>Trạng thái</th></tr></thead><tbody>{rows.map(r=><tr key={r.escrowAccountId}><td>{r.orderId}</td><td>{r.fundingSource}</td><td>{r.heldAmount} {r.currency}</td><td>{r.status}</td></tr>)}</tbody></table><button disabled={page===0} onClick={()=>setPage(n=>n-1)}>Trước</button>{page+1}/{Math.max(1,pages)}<button disabled={page+1>=pages} onClick={()=>setPage(n=>n+1)}>Sau</button></section>;
}
