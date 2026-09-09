import { buildPetsWeeklyChangeSection } from './core/chatMsgHandler/petGraph';
import { getLootLeaderboard } from './core/chatMsgHandler/lootGraph';
import { buildTcgWeeklyChangeSection } from './core/tcgHandler';

// Each entry builds one section of the recap. Loot reports current standings
// and reuses the exact leaderboard text `!Fetchloot` already produces, so the
// recap always agrees with that command. Pets and TCG instead report the
// *change* since the last recap run rather than a running total - each
// build function resets its own baselines as a side effect each time it
// runs; see their JSDoc. TCG (and the domains after it) are also recap-only
// by design — no chat command, tracked in the shared WEEKLY_RECAP_DB
// database rather than a dedicated one, to stay under the account's D1
// database cap. A section returning null (empty table, no change since last
// time, or its binding isn't wired up yet) is simply omitted.
//
// Adding a new domain (clues, collection log, combat tasks, deaths, personal
// bests) once it has its own tracking table is just one more entry here — no
// other changes needed.
const RECAP_SECTIONS = [
  (env) => buildPetsWeeklyChangeSection(env.PETS_DB),
  (env) => getLootLeaderboard(env.LOOT_DB),
  (env) => buildTcgWeeklyChangeSection(env.WEEKLY_RECAP_DB),
];

/**
 * Builds the weekly recap message from every registered section, or returns
 * null if every section came back empty (nothing worth posting).
 * @param {*} env - The Worker's environment bindings
 * @returns {Promise<string|null>}
 */
async function buildWeeklyRecap(env) {
  const sections = (
    await Promise.all(RECAP_SECTIONS.map((build) => build(env)))
  ).filter(Boolean);

  if (sections.length === 0) return null;

  return `# Weekly Recap\n\n${sections.join('\n\n')}`;
}

export default buildWeeklyRecap;
