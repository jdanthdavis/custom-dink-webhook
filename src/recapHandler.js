import { buildPetsWeeklyChangeSection } from './core/recap/petsRecap';
import { buildLootWeeklyChangeSection } from './core/recap/lootRecap';
import { buildTcgWeeklyChangeSection } from './core/recap/tcgRecap';
import { buildDeathsWeeklyChangeSection } from './core/recap/deathsRecap';
import { buildCollectionLogWeeklyChangeSection } from './core/recap/collectionLogRecap';

// Each entry builds one section of the recap, all living in src/core/recap/.
// Every section reports the *change* since the last recap run rather than a
// running total, via the shared computeAndResetDeltas helper
// (src/core/recap/deltaTracking.js) - see its JSDoc for the baseline-reset
// side effect. None of these have a chat command anymore (the last one,
// !Fetchloot, was removed as redundant once the recap covered the same
// ground) — the weekly recap is the only surface for this data, by design,
// so players can't manually trigger a fetch. TCG, deaths, and collection log
// (and the domains after them) are tracked in the shared WEEKLY_RECAP_DB
// database rather than a dedicated one, to stay under the account's D1
// database cap. A section returning null (empty table, no change since last
// time, or its binding isn't wired up yet) is simply omitted.
//
// Adding a new domain (clues, combat tasks, personal bests) once it has its
// own tracking table is a new file in src/core/recap/ (built on
// computeAndResetDeltas if it's a change-since-last-time section) plus one
// more entry here — no other changes needed.
const RECAP_SECTIONS = [
  (env) => buildPetsWeeklyChangeSection(env.PETS_DB),
  (env) => buildLootWeeklyChangeSection(env.LOOT_DB),
  (env) => buildTcgWeeklyChangeSection(env.WEEKLY_RECAP_DB),
  (env) => buildDeathsWeeklyChangeSection(env.WEEKLY_RECAP_DB),
  (env) => buildCollectionLogWeeklyChangeSection(env.WEEKLY_RECAP_DB),
];

/**
 * Formats a date as `M/D` (no leading zeros), in UTC - matching the Cron
 * Trigger's fixed UTC firing time (see wrangler.toml's DST note).
 * @param {Date} date
 * @returns {string}
 */
function formatRecapDate(date) {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

/**
 * Builds the weekly recap message from every registered section, or returns
 * null if every section came back empty (nothing worth posting). The heading
 * includes the date range covered - the 7 days ending on `now`.
 * @param {*} env - The Worker's environment bindings
 * @param {Date} [now] - The recap's end date, defaulting to the current time; pass the scheduled event's own time in production so it reflects when the cron actually fired
 * @returns {Promise<string|null>}
 */
async function buildWeeklyRecap(env, now = new Date()) {
  const sections = (
    await Promise.all(RECAP_SECTIONS.map((build) => build(env)))
  ).filter(Boolean);

  if (sections.length === 0) return null;

  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  const heading = `Weekly Recap: ${formatRecapDate(weekStart)} - ${formatRecapDate(now)}`;

  return `# ${heading}\n\n${sections.join('\n\n')}`;
}

export default buildWeeklyRecap;
