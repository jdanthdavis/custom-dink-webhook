import { BIG_ACHIEVEMENTS } from '../bigAchievements';
import { formatLeaderboardTable } from '../helperFunctions';
import { PLAYER_DISPLAY_NAMES } from '../../constants';

/**
 * Builds the big achievements section: milestones first reached since last
 * time, grouped by achievement in definition order. Marks them reported so
 * each appears in exactly one recap. Recap-only - no chat command.
 * @param {*} WEEKLY_RECAP_DB
 * @returns {Promise<string|null>}
 */
export async function buildBigAchievementsWeeklyChangeSection(WEEKLY_RECAP_DB) {
  /** @type {any[]|undefined} */
  let rows;
  try {
    const { results } = await WEEKLY_RECAP_DB.prepare(
      `SELECT playername, achievement_id FROM big_achievements WHERE reported_at IS NULL ORDER BY achieved_at`
    ).all();
    rows = results;
  } catch (error) {
    console.log(
      'buildBigAchievementsWeeklyChangeSection error:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
  if (!rows || rows.length === 0) return null;

  try {
    await WEEKLY_RECAP_DB.prepare(
      `UPDATE big_achievements SET reported_at = datetime('now') WHERE reported_at IS NULL`
    ).run();
  } catch (error) {
    console.log(
      'buildBigAchievementsWeeklyChangeSection reset error:',
      error instanceof Error ? error.message : error
    );
  }

  // Group each player's achievements together (definition order within a
  // player), then put whoever has the most first; ties keep first-seen order.
  /** @type {Map<string, string[]>} */
  const byPlayer = new Map();
  for (const { id, label } of BIG_ACHIEVEMENTS) {
    for (const row of rows.filter((r) => r.achievement_id === id)) {
      const name =
        PLAYER_DISPLAY_NAMES[row.playername.toUpperCase()] ?? row.playername;
      byPlayer.set(name, [...(byPlayer.get(name) ?? []), label]);
    }
  }
  const tableRows = [...byPlayer.entries()]
    .sort(([, a], [, b]) => b.length - a.length)
    .flatMap(([name, labels]) => labels.map((label) => [name, label]));
  if (tableRows.length === 0) return null;

  return formatLeaderboardTable(
    'Big Achievements',
    ['Name', 'Achievement'],
    tableRows
  );
}
