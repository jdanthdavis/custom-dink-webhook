import { formatLeaderboardTable } from '../helperFunctions';

/**
 * Builds the levels section of the weekly recap: each player's total levels
 * gained across every skill since the *last* time this ran, alongside the
 * single skill they gained the most levels in - not their lifetime totals.
 * Players with no levels gained since last time are omitted.
 *
 * Unlike every other weekly-recap section, this doesn't use the shared
 * computeAndResetDeltas helper (src/core/recap/deltaTracking.js) - that
 * helper assumes one row per player with named metric columns, but
 * `skill_levels` has one row per player *per skill*. So this hand-rolls the
 * same fetch/diff/filter/reset/return shape: fetch every skill row, group by
 * player summing each skill's delta (a missing baseline counts as 0, so a
 * skill's first tracked level counts fully toward this week), track the
 * single largest per-skill delta as "skill most leveled", then reset every
 * changed skill row's baseline to its current level.
 *
 * Recap-only by design - there's no chat command; this data only surfaces
 * here.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @returns {Promise<string|null>}
 */
export async function buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB) {
  /** @type {any[]|null} */
  let rows;
  try {
    const { results } = await WEEKLY_RECAP_DB.prepare(
      'SELECT playername, skill_name, level, level_baseline FROM skill_levels'
    ).all();
    rows = results;
  } catch (error) {
    console.log(
      'buildLevelsWeeklyChangeSection error:',
      error instanceof Error ? error.message : error
    );
    return null;
  }

  if (!rows || rows.length === 0) return null;

  /** @type {Map<string, { playername: string, levelsDelta: number, topSkill: string|null, topDelta: number }>} */
  const byPlayer = new Map();
  for (const row of rows) {
    const delta = (Number(row.level) || 0) - (Number(row.level_baseline) || 0);
    if (delta <= 0) continue;

    const entry = byPlayer.get(row.playername) ?? {
      playername: row.playername,
      levelsDelta: 0,
      topSkill: null,
      topDelta: 0,
    };
    entry.levelsDelta += delta;
    if (delta > entry.topDelta) {
      entry.topDelta = delta;
      entry.topSkill = row.skill_name;
    }
    byPlayer.set(row.playername, entry);
  }

  const changes = [...byPlayer.values()];

  // Reset baselines regardless of what was reported above, so next time's
  // deltas are measured from here - but only rows that actually changed
  // (SQLite's IS NOT is null-safe, so a brand-new row with a NULL baseline
  // still counts as "changed" and gets reset).
  try {
    await WEEKLY_RECAP_DB.prepare(
      `UPDATE skill_levels SET level_baseline = level
       WHERE level_baseline IS NOT level`
    ).run();
  } catch (error) {
    console.log(
      'buildLevelsWeeklyChangeSection reset error:',
      error instanceof Error ? error.message : error
    );
  }

  if (changes.length === 0) return null;

  const sorted = changes.sort((a, b) => b.levelsDelta - a.levelsDelta);

  const headers = ['Name', 'Levels Gained', 'Skill Most Leveled'];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.levelsDelta.toLocaleString('en-US'),
    row.topSkill ?? '-',
  ]);

  return formatLeaderboardTable('Levels Board', headers, tableRows);
}
