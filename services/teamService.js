import { getDb } from '../database/mongo.js';
export async function createTeam({ guildId, name, tag, description, color, leaderId, leaderName }) {
  const db = getDb();
  const col = db.collection('server_teams');
  const cleanTag = tag.trim().toUpperCase();
  const cleanName = name.trim();
  const existing = await col.findOne({
    guildId,
    $or: [
      { tag: { $regex: new RegExp(`^${cleanTag}$`, 'i') } },
      { name: { $regex: new RegExp(`^${cleanName}$`, 'i') } },
    ],
  });
  if (existing) {
    return { success: false, message: 'Ce nom ou tag d\'équipe est déjà utilisé sur ce serveur.' };
  }
  const alreadyInTeam = await col.findOne({ guildId, 'members.userId': leaderId });
  if (alreadyInTeam) {
    return { success: false, message: 'Vous êtes déjà membre d\'une équipe. Quittez-la avant d\'en créer une nouvelle.' };
  }
  const teamId = `team_${cleanTag.toLowerCase()}`;
  const teamDoc = {
    _id: teamId,
    guildId,
    name: cleanName,
    tag: cleanTag,
    description: description || 'Équipe officielle Saez Animes',
    color: color || '#00e5ff',
    leaderId,
    leaderName,
    points: 0,
    members: [
      {
        userId: leaderId,
        username: leaderName,
        role: 'Chef',
        joinedAt: new Date(),
      },
    ],
    createdAt: new Date(),
  };
  await col.insertOne(teamDoc);
  return { success: true, team: teamDoc };
}
export async function joinTeam(guildId, teamIdentifier, userId, username) {
  const db = getDb();
  const col = db.collection('server_teams');
  const existingMember = await col.findOne({ guildId, 'members.userId': userId });
  if (existingMember) {
    return { success: false, message: `Vous faites déjà partie de l'équipe **[${existingMember.tag}] ${existingMember.name}**.` };
  }
  const team = await col.findOne({
    guildId,
    $or: [
      { tag: { $regex: new RegExp(`^${teamIdentifier.trim()}$`, 'i') } },
      { name: { $regex: new RegExp(`^${teamIdentifier.trim()}$`, 'i') } },
      { _id: teamIdentifier },
    ],
  });
  if (!team) {
    return { success: false, message: 'Équipe introuvable avec ce nom ou tag.' };
  }
  await col.updateOne(
    { _id: team._id },
    {
      $push: {
        members: {
          userId,
          username,
          role: 'Membre',
          joinedAt: new Date(),
        },
      },
    }
  );
  return { success: true, team };
}
export async function leaveTeam(guildId, userId) {
  const db = getDb();
  const col = db.collection('server_teams');
  const team = await col.findOne({ guildId, 'members.userId': userId });
  if (!team) {
    return { success: false, message: 'Vous ne faites partie d\'aucune équipe.' };
  }
  if (team.leaderId === userId) {
    const otherMembers = team.members.filter((m) => m.userId !== userId);
    if (otherMembers.length === 0) {
      await col.deleteOne({ _id: team._id });
      return { success: true, disbanded: true, teamName: team.name };
    } else {
      const newLeader = otherMembers[0];
      await col.updateOne(
        { _id: team._id },
        {
          $pull: { members: { userId } },
          $set: { leaderId: newLeader.userId, leaderName: newLeader.username },
        }
      );
      return { success: true, disbanded: false, newLeader: newLeader.username, teamName: team.name };
    }
  }
  await col.updateOne({ _id: team._id }, { $pull: { members: { userId } } });
  return { success: true, disbanded: false, teamName: team.name };
}
export async function getTeamInfo(guildId, teamIdentifier) {
  const db = getDb();
  const col = db.collection('server_teams');
  return await col.findOne({
    guildId,
    $or: [
      { tag: { $regex: new RegExp(`^${teamIdentifier.trim()}$`, 'i') } },
      { name: { $regex: new RegExp(`^${teamIdentifier.trim()}$`, 'i') } },
      { 'members.userId': teamIdentifier },
    ],
  });
}
export async function getTeamsLeaderboard(guildId, limit = 10) {
  try {
    const db = getDb();
    const col = db.collection('server_teams');
    return await col.find({ guildId }).sort({ points: -1, createdAt: 1 }).limit(limit).toArray();
  } catch (err) {
    console.error('[TeamService] Erreur getTeamsLeaderboard:', err.message);
    return [];
  }
}
export const getTopTeams = getTeamsLeaderboard;
export const getTeamByName = getTeamInfo;
