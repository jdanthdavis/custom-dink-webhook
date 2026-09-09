import { buildPetsWeeklyChangeSection } from './core/chatMsgHandler/petGraph';
import { getLootLeaderboard } from './core/chatMsgHandler/lootGraph';
import { buildTcgWeeklyChangeSection } from './core/tcgHandler';

// Each entry builds one section of the recap. Loot reports current standings;
// pets and TCG instead report the *change* since the last recap run rather
// than a running total - each build function resets its own baselines as a
// side effect each time it runs; see their JSDoc. None of these have a chat
// command anymore (the last one, !Fetchloot, was removed as redundant once
// the recap covered the same ground) — the weekly recap is the only surface
// for this data, by design, so players can't manually trigger a fetch. TCG
// (and the domains after it) are tracked in the shared WEEKLY_RECAP_DB
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
