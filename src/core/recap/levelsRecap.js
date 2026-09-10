import { formatValue, formatLeaderboardTable } from '../helperFunctions';
import { theBoys } from '../../constants';
import { fetchAndRecordAllHiscoresXp } from './hiscoresXp';

/**
 * Fetches a per-skill table (one row per player per skill), diffs each row
 * against its baseline, aggregates per player, and resets changed baselines.
 * If `totalSkillName` names a rollup row (e.g. Hiscores' "Overall"), its own
 * delta is used as the total instead of summing every row, and it's excluded
 * from the "top skill" comparison.
 * @param {*} WEEKLY_RECAP_DB
 * @param {object} options
 * @param {string} options.table
 * @param {string} options.currentColumn
 * @param {string} options.baselineColumn
 * @param {string} [options.totalSkillName]
 * @returns {Promise<Map<string, { playername: string, delta: number, topSkill: string|null, topDelta: number }>>}
 */
async function aggregatePerSkillDeltas(
  WEEKLY_RECAP_DB,
  { table, currentColumn, baselineColumn, totalSkillName }
) {
  /** @type {Map<string, { playername: string, delta: number, topSkill: string|null, topDelta: number }>} */
  const byPlayer = new Map();

  /** @type {any[]|null} */
  let rows;
  try {
    const { results } = await WEEKLY_RECAP_DB.prepare(
      `SELECT playername, skill_name, ${currentColumn}, ${baselineColumn} FROM ${table}`
    ).all();
    rows = results;
  } catch (error) {
    console.log(
      `aggregatePerSkillDeltas(${table}) error:`,
      error instanceof Error ? error.message : error
    );
    return byPlayer;
  }

  for (const row of rows ?? []) {
    const delta =
      (Number(row[currentColumn]) || 0) - (Number(row[baselineColumn]) || 0);
    if (delta <= 0) continue;

    const entry = byPlayer.get(row.playername) ?? {
      playername: row.playername,
      delta: 0,
      topSkill: null,
      topDelta: 0,
    };

    const isTotalRow = totalSkillName && row.skill_name === totalSkillName;
    if (isTotalRow) {
      entry.delta = delta;
    } else if (!totalSkillName) {
      entry.delta += delta;
    }
    if (!isTotalRow && delta > entry.topDelta) {
      entry.topDelta = delta;
      entry.topSkill = row.skill_name;
    }
    byPlayer.set(row.playername, entry);
  }

  // Reset baselines regardless of what was reported above, so next time's
  // deltas are measured from here - but only rows that actually changed
  // (SQLite's IS NOT is null-safe, so a brand-new row with a NULL baseline
  // still counts as "changed" and gets reset).
  try {
    await WEEKLY_RECAP_DB.prepare(
      `UPDATE ${table} SET ${baselineColumn} = ${currentColumn}
       WHERE ${baselineColumn} IS NOT ${currentColumn}`
    ).run();
  } catch (error) {
    console.log(
      `aggregatePerSkillDeltas(${table}) reset error:`,
      error instanceof Error ? error.message : error
    );
  }

  return byPlayer;
}

/**
 * Looks up each player's real display-case name from `skill_levels` history,
 * so an XP-only player (no level-ups this week) doesn't show theBoys' all-caps form.
 * @param {*} WEEKLY_RECAP_DB
 * @returns {Promise<Map<string, string>>} uppercase playername -> display-case name
 */
async function getKnownDisplayNames(WEEKLY_RECAP_DB) {
  /** @type {Map<string, string>} */
  const displayNames = new Map();
  try {
    const { results } = await WEEKLY_RECAP_DB.prepare(
      'SELECT DISTINCT playername FROM skill_levels'
    ).all();
    for (const row of results ?? []) {
      displayNames.set(row.playername.toUpperCase(), row.playername);
    }
  } catch (error) {
    console.log(
      'getKnownDisplayNames error:',
      error instanceof Error ? error.message : error
    );
  }
  return displayNames;
}

/**
 * Builds the Levels Board: levels gained (skill_levels) and Total XP Gained
 * (polled from OSRS Hiscores, skill_xp) since last time, each with the
 * skill that drove the most. A player appears if they gained either.
 * Doesn't use the shared computeAndResetDeltas helper since both tables have
 * one row per player *per skill* - see aggregatePerSkillDeltas above.
 * Recap-only - no chat command.
 * @param {*} WEEKLY_RECAP_DB
 * @returns {Promise<string|null>}
 */
export async function buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB) {
  try {
    await fetchAndRecordAllHiscoresXp(WEEKLY_RECAP_DB, theBoys);
  } catch (error) {
    console.log(
      'buildLevelsWeeklyChangeSection hiscores error:',
      error instanceof Error ? error.message : error
    );
  }

  const [levelsByPlayer, xpByPlayer, displayNames] = await Promise.all([
    aggregatePerSkillDeltas(WEEKLY_RECAP_DB, {
      table: 'skill_levels',
      currentColumn: 'level',
      baselineColumn: 'level_baseline',
    }),
    aggregatePerSkillDeltas(WEEKLY_RECAP_DB, {
      table: 'skill_xp',
      currentColumn: 'xp',
      baselineColumn: 'xp_baseline',
      totalSkillName: 'Overall',
    }),
    getKnownDisplayNames(WEEKLY_RECAP_DB),
  ]);

  // Merge by playername, case-insensitively - skill_xp is seeded from the
  // uppercase theBoys allowlist, while skill_levels uses Dink's actual
  // display-case name. A player with levels data this week already gets
  // that nicer casing for free below; an XP-only player falls back to
  // getKnownDisplayNames's lookup (their real name from any past
  // skill_levels row), and only to the raw theBoys casing if that player
  // has genuinely never appeared in skill_levels at all.
  /** @type {Map<string, { playername: string, levelsDelta: number, topLevelSkill: string|null, xpDelta: number, topXpSkill: string|null, topXpDelta: number }>} */
  const merged = new Map();

  for (const entry of levelsByPlayer.values()) {
    merged.set(entry.playername.toUpperCase(), {
      playername: entry.playername,
      levelsDelta: entry.delta,
      topLevelSkill: entry.topSkill,
      xpDelta: 0,
      topXpSkill: null,
      topXpDelta: 0,
    });
  }

  for (const entry of xpByPlayer.values()) {
    const key = entry.playername.toUpperCase();
    const existing = merged.get(key);
    if (existing) {
      existing.xpDelta = entry.delta;
      existing.topXpSkill = entry.topSkill;
      existing.topXpDelta = entry.topDelta;
    } else {
      merged.set(key, {
        playername: displayNames.get(key) ?? entry.playername,
        levelsDelta: 0,
        topLevelSkill: null,
        xpDelta: entry.delta,
        topXpSkill: entry.topSkill,
        topXpDelta: entry.topDelta,
      });
    }
  }

  const changes = [...merged.values()].filter(
    (row) => row.levelsDelta > 0 || row.xpDelta > 0
  );
  if (changes.length === 0) return null;

  // Primarily by XP gained (the more meaningful, continuous metric now that
  // maxed skills can show up here); ties broken by levels gained.
  const sorted = changes.sort(
    (a, b) => b.xpDelta - a.xpDelta || b.levelsDelta - a.levelsDelta
  );

  const headers = [
    'Name',
    'Levels Gained',
    'Skill Most Leveled',
    'Total XP Gained',
    'Top Skill (XP)',
  ];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.levelsDelta.toLocaleString('en-US'),
    row.topLevelSkill ?? '-',
    formatValue(row.xpDelta, true),
    row.topXpSkill ? `${row.topXpSkill} ${formatValue(row.topXpDelta)}` : '-',
  ]);

  return formatLeaderboardTable('Levels Board', headers, tableRows);
}
