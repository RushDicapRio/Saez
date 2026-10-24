import { getDb } from '../database/mongo.js';
export const DEFAULT_FUN_CHANNEL_ID = '';
export async function getFunChannelId(guildId) {
  try {
    const db = getDb();
    const col = db.collection('config');
    const doc = await col.findOne({ _id: `fun_config_${guildId}` });
    return doc?.channel_id || DEFAULT_FUN_CHANNEL_ID;
  } catch {
    return DEFAULT_FUN_CHANNEL_ID;
  }
}
export async function setFunChannelId(guildId, channelId) {
  const db = getDb();
  const col = db.collection('config');
  await col.updateOne(
    { _id: `fun_config_${guildId}` },
    { $set: { channel_id: channelId, updated_at: new Date() } },
    { upsert: true }
  );
}
export const ANIME_QUIZ_QUESTIONS = [
  {
    question: "Dans One Piece, quel est le nom du sabre noir légendaire de Mihawk ?",
    answers: ["Yoru", "Shusui", "Wado Ichimonji", "Enma"],
    correct: 0,
    explanation: "Mihawk manie **Yoru**, l'une des 12 lames de premier rang (Saijo O Wazamono).",
    anime: "One Piece",
  },
  {
    question: "Dans Naruto, qui a appris le Rasengan à Naruto Uzumaki ?",
    answers: ["Kakashi Hatake", "Jiraya", "Minato Namikaze", "Iruka Umino"],
    correct: 1,
    explanation: "**Jiraya** (l'ermite pas net) lui a enseigné le Rasengan pendant leur voyage.",
    anime: "Naruto",
  },
  {
    question: "Dans Attack on Titan (SnK), quel est le nom du Titan de sang royal contrôlé par Sieg ?",
    answers: ["Titan Cuirassé", "Titan Marteau", "Titan Bestial", "Titan Colossal"],
    correct: 2,
    explanation: "Sieg Jäger possède le pouvoir du **Titan Bestial**.",
    anime: "L'Attaque des Titans",
  },
  {
    question: "Dans Demon Slayer, quelle est la couleur du katana Nichirin de Tanjiro ?",
    answers: ["Bleu", "Rouge carmin", "Noir corbeau", "Jaune foudre"],
    correct: 2,
    explanation: "Le katana de Tanjiro devient **noir corbeau**, symbole des utilisateurs du Souffle du Soleil.",
    anime: "Demon Slayer",
  },
  {
    question: "Dans Death Note, comment s'appelle le Shinigami qui accompagne Light Yagami ?",
    answers: ["Rem", "Ryuk", "Sidoh", "Gelus"],
    correct: 1,
    explanation: "**Ryuk** adore les pommes et suit Light après avoir laissé tomber son carnet.",
    anime: "Death Note",
  },
  {
    question: "Dans Jujutsu Kaisen, quelle est la technique d'extension du territoire de Satoru Gojo ?",
    answers: ["Autel Démoniaque", "Sphère de l'Espace Infini", "Jardin des Ombres", "Cercle Funeste"],
    correct: 1,
    explanation: "L'extension de territoire de Gojo est la **Sphère de l'Espace Infini** (Muryōkūsho).",
    anime: "Jujutsu Kaisen",
  },
  {
    question: "Dans Hunter x Hunter, quel est le type de Nen de Kirua Zoldik ?",
    answers: ["Renforcement", "Transformation", "Matérialisation", "Manipulation"],
    correct: 1,
    explanation: "Kirua est de la **Transformation**, ce qui lui permet de transformer son aura en électricité.",
    anime: "Hunter x Hunter",
  },
  {
    question: "Dans Bleach, quel est le nom du Zanpakuto d'Ichigo Kurosaki ?",
    answers: ["Zangetsu", "Senbonzakura", "Hyorinmaru", "Kyoka Suigetsu"],
    correct: 0,
    explanation: "Le Zanpakuto d'Ichigo s'appelle **Zangetsu**.",
    anime: "Bleach",
  },
  {
    question: "Dans Dragon Ball Z, qui élimine Cell parfait lors du Cell Game ?",
    answers: ["Goku", "Vegeta", "Gohan", "Trunks du futur"],
    correct: 2,
    explanation: "**Son Gohan** en Super Saiyan 2 pulvérise Cell avec son célèbre Kaméhaméha Père-Fils.",
    anime: "Dragon Ball Z",
  },
  {
    question: "Dans My Hero Academia, quel était le nom de héros initial d'Izuku Midoriya donné par Bakugo ?",
    answers: ["Deku", "Dynamight", "Ingenium", "All Might Jr"],
    correct: 0,
    explanation: "**Deku** signifiait 'bon à rien', mais Izuku en a fait son symbole d'espoir.",
    anime: "My Hero Academia",
  },
  {
    question: "Dans Fullmetal Alchemist: Brotherhood, quel est le premier principe de l'alchimie ?",
    answers: ["L'Échange Équivalent", "La Transmutation Humaine", "Le Cercle Stellaire", "L'Énergie d'Ametris"],
    correct: 0,
    explanation: "**L'Échange Équivalent** : pour obtenir quelque chose, il faut donner une chose de même valeur.",
    anime: "Fullmetal Alchemist",
  },
  {
    question: "Dans Solo Leveling, quelle est la première classe débloquée par Sung Jinwoo ?",
    answers: ["Nécromancien", "Assassin de l'Ombre", "Mage de Sang", "Chasseur Rang S"],
    correct: 0,
    explanation: "Sung Jinwoo débloque la classe secrète de **Nécromancien**, qui évolue ensuite en Monarque des Ombres.",
    anime: "Solo Leveling",
  },
];
