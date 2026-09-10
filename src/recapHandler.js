import { buildPetsWeeklyChangeSection } from './core/recap/petsRecap';
import { buildLootWeeklyChangeSection } from './core/recap/lootRecap';
import { buildTcgWeeklyChangeSection } from './core/recap/tcgRecap';
import { buildDeathsWeeklyChangeSection } from './core/recap/deathsRecap';
import { buildCollectionLogWeeklyChangeSection } from './core/recap/collectionLogRecap';
import { buildLevelsWeeklyChangeSection } from './core/recap/levelsRecap';

// Each entry builds one section of the recap, all living in src/core/recap/.
// Every section reports the change since the last run, mostly via the
// shared computeAndResetDeltas helper (deltaTracking.js) - levels is the
// exception, hand-rolling the same shape since its tables have one row per
// player per skill (see levelsRecap.js). Recap-only, no chat commands.
// Every domain except pets shares the WEEKLY_RECAP_DB database to stay
// under the account's D1 cap. A section returning null is omitted.
//
// New domain: a file in src/core/recap/ plus one entry here.
const RECAP_SECTIONS = [
  (env) => buildPetsWeeklyChangeSection(env.PETS_DB),
  (env) => buildLootWeeklyChangeSection(env.WEEKLY_RECAP_DB),
  (env) => buildTcgWeeklyChangeSection(env.WEEKLY_RECAP_DB),
  (env) => buildDeathsWeeklyChangeSection(env.WEEKLY_RECAP_DB),
  (env) => buildCollectionLogWeeklyChangeSection(env.WEEKLY_RECAP_DB),
  (env) => buildLevelsWeeklyChangeSection(env.WEEKLY_RECAP_DB),
];

/**
 * Formats a date as `MM/DD/YY` (zero-padded, two-digit year), in UTC -
 * matching the Cron Trigger's fixed UTC firing time (see wrangler.toml's
 * DST note).
 * @param {Date} date
 * @returns {string}
 */
function formatRecapDate(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

/**
 * Builds the weekly recap message from every section, or null if all are empty.
 * @param {*} env
 * @param {Date} [now] - recap end date; pass the scheduled event's own time in production
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
