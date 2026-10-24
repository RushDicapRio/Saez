import { getDb } from '../database/mongo.js';
export async function addTask(userId, guildOrTitle, titleArg, priority = 'Normale', dueDate = null) {
  const db = getDb();
  const col = db.collection('user_tasks');
  const id = `task_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  let title = '';
  let guildId = null;
  if (titleArg !== undefined) {
    guildId = guildOrTitle;
    title = titleArg;
  } else {
    title = guildOrTitle;
  }
  const doc = {
    _id: id,
    userId,
    guildId,
    title: (title || '').trim(),
    priority, 
    dueDate,
    completed: false,
    completedAt: null,
    createdAt: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}
export async function getUserTasks(userId) {
  try {
    const db = getDb();
    const col = db.collection('user_tasks');
    return await col.find({ userId }).sort({ completed: 1, createdAt: -1 }).toArray();
  } catch (err) {
    console.error('[TaskService] Erreur getUserTasks:', err.message);
    return [];
  }
}
export async function toggleTaskComplete(userId, taskId) {
  const db = getDb();
  const col = db.collection('user_tasks');
  const task = await col.findOne({ _id: taskId, userId });
  if (!task) return null;
  const nextCompleted = !task.completed;
  await col.updateOne(
    { _id: taskId, userId },
    {
      $set: {
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date() : null,
      },
    }
  );
  return { ...task, completed: nextCompleted };
}
export async function deleteTask(userId, taskId) {
  const db = getDb();
  const col = db.collection('user_tasks');
  const res = await col.deleteOne({ _id: taskId, userId });
  return res.deletedCount > 0;
}
export const completeTask = toggleTaskComplete;
