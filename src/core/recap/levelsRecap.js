import { formatValue, formatLeaderboardTable } from '../helperFunctions';
import { theBoys, PLAYER_DISPLAY_NAMES } from '../../constants';
import { fetchAndRecordAllHiscoresXp } from './hiscoresXp';

/**
 * Fetches a per-skill table (one row per player per skill), diffs one or
 * more metrics against their own baseline, aggregates per player, and
 * resets every changed baseline in one pass.
 *
 * A metric's `totalSkillName`, when given, names a row (e.g. Hiscores'
 * "Overall") whose own delta is used directly as that metric's total
 * instead of summing every row - that row is also excluded from that
 * metric's "top skill" comparison, since it isn't a real skill.
 * @param {*} WEEKLY_RECAP_DB
 * @param {object} options
 * @param {string} options.table
 * @param {Array<{ current: string, baseline: string, key: string, totalSkillName?: string }>} options.metrics
 * @returns {Promise<Map<string, { playername: string, [field: string]: any }>>} playername -> `{ playername, <key>Delta, <key>TopSkill, <key>TopDelta }` per metric
 */
async function aggregatePerSkillDeltas(WEEKLY_RECAP_DB, { table, metrics }) {
  /** @type {Map<string, { playername: string, [field: string]: any }>} */
  const byPlayer = new Map();

  const columns = [
    'playername',
    'skill_name',
    ...metrics.flatMap(({ current, baseline }) => [current, baseline]),
  ];

  /** @type {any[]|null} */
  let rows;
  try {
    const { results } = await WEEKLY_RECAP_DB.prepare(
      `SELECT ${columns.join(', ')} FROM ${table}`
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
    for (const { current, baseline, key, totalSkillName } of metrics) {
      const delta = (Number(row[current]) || 0) - (Number(row[baseline]) || 0);
      if (delta <= 0) continue;

      const entry = byPlayer.get(row.playername) ?? {
        playername: row.playername,
      };
      entry[`${key}Delta`] ??= 0;
      entry[`${key}TopSkill`] ??= null;
      entry[`${key}TopDelta`] ??= 0;

      const isTotalRow = totalSkillName && row.skill_name === totalSkillName;
      if (isTotalRow) {
        entry[`${key}Delta`] = delta;
      } else if (!totalSkillName) {
        entry[`${key}Delta`] += delta;
      }
      if (!isTotalRow && delta > entry[`${key}TopDelta`]) {
        entry[`${key}TopDelta`] = delta;
        entry[`${key}TopSkill`] = row.skill_name;
      }
      byPlayer.set(row.playername, entry);
    }
  }

  // Reset every metric's baseline regardless of what was reported above, so
  // next time's deltas are measured from here - but only rows that actually
  // changed (SQLite's IS NOT is null-safe, so a brand-new row with a NULL
  // baseline still counts as "changed" and gets reset).
  const resetAssignments = metrics
    .map(({ current, baseline }) => `${baseline} = ${current}`)
    .join(', ');
  const changedCondition = metrics
    .map(({ current, baseline }) => `${baseline} IS NOT ${current}`)
    .join(' OR ');
  try {
    await WEEKLY_RECAP_DB.prepare(
      `UPDATE ${table} SET ${resetAssignments} WHERE ${changedCondition}`
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
 * Builds the Levels Board: levels gained and Total XP Gained since last
 * time, both polled from the public OSRS Hiscores API (skill_xp), each with
 * the skill that drove the most. Both totals come from the delta on
 * Hiscores' own "Overall" row rather than summing individual skills, since a
 * player can have a real level/XP in a skill they aren't ranked in yet
 * (filtered out of the per-skill rows entirely). A player appears if they
 * gained either levels or XP.
 *
 * Doesn't use the shared computeAndResetDeltas helper since `skill_xp` has
 * one row per player *per skill* - see aggregatePerSkillDeltas above.
 *
 * The Hiscores poll (src/core/recap/hiscoresXp.js) is wrapped in its own
 * try/catch so an outage there can't block the rest of the recap - the
 * board just comes back empty that week instead.
 *
 * Recap-only by design - there's no chat command; this data only surfaces
 * here.
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

  const byPlayer = await aggregatePerSkillDeltas(WEEKLY_RECAP_DB, {
    table: 'skill_xp',
    metrics: [
      {
        current: 'level',
        baseline: 'level_baseline',
        key: 'levels',
        totalSkillName: 'Overall',
      },
      {
        current: 'xp',
        baseline: 'xp_baseline',
        key: 'xp',
        totalSkillName: 'Overall',
      },
    ],
  });

  const changes = [...byPlayer.values()].filter(
    (row) => (row.levelsDelta ?? 0) > 0 || (row.xpDelta ?? 0) > 0
  );
  if (changes.length === 0) return null;

  // Primarily by XP gained (the more meaningful, continuous metric now that
  // maxed skills can show up here); ties broken by levels gained.
  const sorted = changes.sort(
    (a, b) =>
      (b.xpDelta ?? 0) - (a.xpDelta ?? 0) ||
      (b.levelsDelta ?? 0) - (a.levelsDelta ?? 0)
  );

  const headers = [
    'Name',
    'Levels Gained',
    'Skill Most Levelled',
    'Total XP Gained',
    'Top Skill (XP)',
  ];
  const tableRows = sorted.map((row) => [
    PLAYER_DISPLAY_NAMES[row.playername.toUpperCase()] ?? row.playername,
    (row.levelsDelta ?? 0).toLocaleString('en-US'),
    row.levelsTopSkill ?? '-',
    formatValue(row.xpDelta ?? 0, true),
    row.xpTopSkill ? `${row.xpTopSkill} ${formatValue(row.xpTopDelta)}` : '-',
  ]);

  return formatLeaderboardTable('Levels Board', headers, tableRows);
}
