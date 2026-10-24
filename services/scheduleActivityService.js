import { getDb } from '../database/mongo.js';
export async function createScheduleActivity({
  guildId,
  title,
  description,
  date,
  time,
  channelId,
  authorId,
  authorName,
}) {
  const db = getDb();
  const col = db.collection('server_schedule_activities');
  const id = `act_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const activityDoc = {
    _id: id,
    guildId,
    title,
    description: description || '',
    date, 
    time: time || '21:00', 
    channelId: channelId || null,
    authorId,
    authorName,
    participants: [authorId],
    status: 'scheduled', 
    createdAt: new Date(),
  };
  await col.insertOne(activityDoc);
  return activityDoc;
}
export async function getScheduleActivities(guildId, filterStatus = null) {
  try {
    const db = getDb();
    const col = db.collection('server_schedule_activities');
    const query = { guildId };
    if (filterStatus) {
      query.status = filterStatus;
    } else {
      query.status = { $ne: 'cancelled' };
    }
    const list = await col.find(query).sort({ date: 1, time: 1 }).toArray();
    return list;
  } catch (err) {
    console.error('[ScheduleActivityService] Erreur getScheduleActivities:', err.message);
    return [];
  }
}
export async function toggleActivityParticipant(activityId, userId) {
  const db = getDb();
  const col = db.collection('server_schedule_activities');
  const act = await col.findOne({ _id: activityId });
  if (!act) return { success: false, message: 'Activité introuvable.' };
  const isAlready = act.participants?.includes(userId);
  if (isAlready) {
    await col.updateOne({ _id: activityId }, { $pull: { participants: userId } });
    return { success: true, joined: false, total: act.participants.length - 1 };
  } else {
    await col.updateOne({ _id: activityId }, { $addToSet: { participants: userId } });
    return { success: true, joined: true, total: (act.participants?.length || 0) + 1 };
  }
}
export async function cancelScheduleActivity(activityId) {
  const db = getDb();
  const col = db.collection('server_schedule_activities');
  const res = await col.updateOne({ _id: activityId }, { $set: { status: 'cancelled', cancelledAt: new Date() } });
  return res.modifiedCount > 0;
}
export const deleteScheduleActivity = cancelScheduleActivity;
export const getUpcomingActivities = getScheduleActivities;
