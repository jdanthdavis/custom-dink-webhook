import { getPetsLeaderboard } from './core/chatMsgHandler/petGraph';
import { getLootLeaderboard } from './core/chatMsgHandler/lootGraph';

// Each entry builds one section of the recap from its own D1 binding, reusing
// the exact leaderboard text `!Fetchpets`/`!Fetchloot` already produce, so the
// recap always agrees with those commands. A section returning null (empty
// table, or its binding isn't wired up yet) is simply omitted.
//
// Adding a new domain (clues, collection log, combat tasks, deaths, personal
// bests, TCG) once it has its own tracking table is just one more entry here
// — no other changes needed.
const RECAP_SECTIONS = [
  (env) => getPetsLeaderboard(env.PETS_DB),
  (env) => getLootLeaderboard(env.LOOT_DB),
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
