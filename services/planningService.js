import { getDb } from '../database/mongo.js';
export const DAYS_OF_WEEK = [
  { id: 1, name: 'Lundi' },
  { id: 2, name: 'Mardi' },
  { id: 3, name: 'Mercredi' },
  { id: 4, name: 'Jeudi' },
  { id: 5, name: 'Vendredi' },
  { id: 6, name: 'Samedi' },
  { id: 7, name: 'Dimanche' },
];
export async function getWeeklyPlanning() {
  const db = getDb();
  try {
    const col = db.collection('planning');
    const doc = (await col.findOne({ _id: 'anime_planning' })) || (await col.findOne({ _id: 'weekly_planning' }));
    if (doc && Array.isArray(doc.data)) {
      return doc.data;
    }
  } catch (err) {
    console.error('[PlanningService] Erreur lecture planning:', err.message);
  }
  return [];
}
export async function getPlanningForDay(dayId) {
  const all = await getWeeklyPlanning();
  let targetDay = dayId;
  if (!targetDay) {
    const currentDayJs = new Date().getDay();
    targetDay = currentDayJs === 0 ? 7 : currentDayJs;
  }
  return {
    dayName: DAYS_OF_WEEK.find((d) => d.id === targetDay)?.name || 'Aujourd’hui',
    entries: all.filter((p) => p.day_of_week === targetDay),
  };
}
