import {useQuery} from '@tanstack/react-query';
import {Text} from 'react-native';import {orderApi} from '@/api/orderApi';import {Card} from '@/ui';
export function RewardQuoteCard({orderId,amendmentId,revision}:{orderId:string;amendmentId?:string;revision?:string|null}){
 const q=useQuery({queryKey:['orderRewardQuote',orderId,amendmentId,revision],retry:false,queryFn:async()=>((amendmentId?await orderApi.getAmendmentRewardQuote(orderId,amendmentId):await orderApi.getOrderRewardQuote(orderId))).result});
 return <Card><Text>Thưởng dự kiến</Text>{q.data?<Text>{q.data.points} điểm · Cap còn lại cặp {q.data.remainingPairCap}, Provider {q.data.remainingProviderCap} · Model {q.data.modelVersion}. Chỉ grant khi đủ điều kiện.</Text>:<Text>{q.error?.message??'Đang đối chiếu quote thưởng…'}</Text>}</Card>;
}
