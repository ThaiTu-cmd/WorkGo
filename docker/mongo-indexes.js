// Runtime collections/indexes; no fixture data.
// All domain collections and indexes are manual, replay-safe and have no TTL deletion.
for (const collection of ['conversations','messages','notifications','inbox_events','outbox_events','chat_attachments','communication_admin_audit']) {
 if(!db.getCollectionNames().includes(collection))db.createCollection(collection);
 if(db.getCollection(collection).findOne({_id:{$type:'binData'}}))throw new Error('Legacy binary UUID mapping requires an explicit verified conversion before this version');
}
db.conversations.createIndex({'participants.userId':1,lastActivityAt:-1,_id:-1},{name:'idx_conv_participant_activity'});
db.conversations.createIndex({contextType:1,contextId:1},{name:'idx_conv_context'});
db.conversations.createIndex({directKey:1},{name:'uq_conv_direct_key',unique:true,partialFilterExpression:{conversationType:'DIRECT_MESSAGE'}});
db.messages.createIndex({conversationId:1,sentAt:-1,_id:-1},{name:'idx_message_conversation_history'});
db.messages.createIndex({conversationId:1,senderId:1,readAt:1},{name:'idx_message_unread'});
db.messages.createIndex({conversationId:1,senderId:1,clientMessageId:1},{name:'uq_message_retry_key',unique:true});
db.notifications.createIndex({recipientId:1,createdAt:-1,_id:-1},{name:'idx_notification_history'});
db.notifications.createIndex({recipientId:1,readAt:1,createdAt:-1,_id:-1},{name:'idx_notification_unread_history'});
db.inbox_events.createIndex({eventId:1},{name:'uq_inbox_event_id',unique:true});
// Run against the owning Communication database before deployment. No TTL: retain >=24 months,
// archive only through an authorized offline workflow; never delete records subject to a hold.
if (!db.getCollectionNames().includes("communication_admin_audit")) db.createCollection("communication_admin_audit");
db.chat_attachments.createIndex({conversationId:1,uploaderId:1,sha256:1},{name:"uq_chat_attachment_source",unique:true});
db.chat_attachments.createIndex({status:1,createdAt:1},{name:"chat_attachment_recovery"});
db.communication_admin_audit.createIndex({actorId:1,createdAt:-1,_id:-1},{name:"audit_actor_time"});
db.communication_admin_audit.createIndex({targetId:1,createdAt:-1,_id:-1},{name:"audit_target_time"});
