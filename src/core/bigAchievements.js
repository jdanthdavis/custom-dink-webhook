import { runD1Write } from './helperFunctions';
import { ALL_PETS, KILL_COUNT, LEVEL, SKILL_NAMES } from '../constants';

// Synthetic event petHandler sends once it knows a player's new pet total -
// Dink's PET payload doesn't carry the total, so it can't be matched up front.
export const PET_TOTAL = 'PET_TOTAL';
const PET_TOTAL_INTERVAL = 5;

/**
 * @typedef {Object} BigAchievement
 * @property {string} id - stable key stored in D1; never rename once shipped
 * @property {string} label - shown in the recap table, e.g. "First Fire Cape"
 * @property {(event: { payloadType: string, extra: any, content: any }) => boolean} matches
 */

/**
 * Whether a payload is a kill-count event for `boss` at exactly `count`.
 * @param {{ payloadType: string, extra: any }} event
 * @param {string} boss - compared case-insensitively
 * @param {number} count
 * @returns {boolean}
 */
function isKillCount({ payloadType, extra }, boss, count) {
  return (
    payloadType === KILL_COUNT &&
    extra?.boss?.toUpperCase() === boss.toUpperCase() &&
    extra?.count === count
  );
}

/**
 * Whether a payload is a level-up event that took `skill` to exactly `level`.
 * @param {{ payloadType: string, extra: any }} event
 * @param {string} skill
 * @param {number} level
 * @returns {boolean}
 */
function reachedLevel({ payloadType, extra }, skill, level) {
  return payloadType === LEVEL && extra?.levelledSkills?.[skill] === level;
}

/**
 * Whether a payload is a PET_TOTAL event for exactly `total` pets.
 * @param {{ payloadType: string, extra: any }} event
 * @param {number} total
 * @returns {boolean}
 */
function reachedPetTotal({ payloadType, extra }, total) {
  return payloadType === PET_TOTAL && extra?.totalPets === total;
}

// To add an achievement: append one entry here. Nothing else needs to change.
// `matches` runs against every tracked-player Dink event, so keep it a cheap
// pure check. Each achievement is recorded once per player.
/** @type {BigAchievement[]} */
export const BIG_ACHIEVEMENTS = [
  {
    id: 'first_fire_cape',
    label: 'First Fire Cape',
    matches: (event) => isKillCount(event, 'TzTok-Jad', 1),
  },
  {
    id: 'first_infernal_cape',
    label: 'First Infernal Cape',
    matches: (event) => isKillCount(event, 'TzKal-Zuk', 1),
  },
  // One per skill (not just a player's first 99), generated from SKILL_NAMES.
  ...SKILL_NAMES.map((skill) => ({
    id: `level_99_${skill.toLowerCase()}`,
    label: `99 ${skill}`,
    matches: (/** @type {any} */ event) => reachedLevel(event, skill, 99),
  })),
  // Every PET_TOTAL_INTERVAL-th pet (5th, 10th, ... up to ALL_PETS).
  ...Array.from(
    { length: Math.floor(ALL_PETS / PET_TOTAL_INTERVAL) },
    (_, i) => (i + 1) * PET_TOTAL_INTERVAL
  ).map((total) => ({
    id: `total_pets_${total}`,
    label: `${total}th Pet`,
    matches: (/** @type {any} */ event) => reachedPetTotal(event, total),
  })),
];

/**
 * Records every big achievement the event satisfies. Already-recorded ones
 * are ignored (INSERT OR IGNORE), so repeats are harmless. Recap-only - no
 * Discord message here.
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} payloadType
 * @param {string} playerName
 * @param {*} extra
 * @param {*} content
 * @returns {Promise<void>}
 */
export async function recordBigAchievements(
  WEEKLY_RECAP_DB,
  payloadType,
  playerName,
  extra,
  content
) {
  const event = { payloadType, extra, content };
  for (const achievement of BIG_ACHIEVEMENTS) {
    if (!achievement.matches(event)) continue;
    await runD1Write(WEEKLY_RECAP_DB, {
      label: 'recordBigAchievements',
      sql: `INSERT OR IGNORE INTO big_achievements (playername, achievement_id) VALUES (?1, ?2)`,
      values: [playerName, achievement.id],
    });
  }
}
