import React,{useEffect,useState} from 'react';
import {orderApi} from '../../../api/orderApi';
export default function RewardQuoteBox({orderId,amendmentId,revision}){
 const [quote,setQuote]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;setQuote(null);setError('');
  const request=amendmentId?orderApi.getAmendmentRewardQuote(orderId,amendmentId):orderApi.getOrderRewardQuote(orderId);
  request.then(r=>{if(!r?.result?.reference||!Number.isInteger(r.result.points))throw new Error('Invalid quote receipt');if(active)setQuote(r.result);}).catch(e=>{if(active)setError(e?.status===404?'Cam kết legacy chưa có quote thưởng.':e.message||'Không tải được quote thưởng');});
  return()=>{active=false;};
 },[orderId,amendmentId,revision]);
 return <div role="status">{quote?<p>Thưởng dự kiến {quote.points} điểm · Cap còn lại cặp {quote.remainingPairCap}, Provider {quote.remainingProviderCap} · Model {quote.modelVersion}. Chỉ grant khi đủ điều kiện; bản chốt và lịch sử được giữ trên server.</p>:<p>{error||'Đang đối chiếu quote thưởng…'}</p>}</div>;
}
