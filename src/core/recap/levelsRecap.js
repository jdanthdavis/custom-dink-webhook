import { formatValue, formatLeaderboardTable } from '../helperFunctions';
import { theBoys } from '../../constants';
import { fetchAndRecordAllHiscoresXp } from './hiscoresXp';

/**
 * Fetches every row from a per-skill table (one row per player per skill),
 * aggregates each player's total delta and single largest per-skill delta,
 * then resets every changed row's baseline to its current value. Shared by
 * `skill_levels` and `skill_xp`, which are structurally identical (one row
 * per player per skill) but track different things (levels vs. XP).
 *
 * `totalSkillName`, when given, names a row (e.g. Hiscores' "Overall") whose
 * own delta is used directly as the player's total instead of summing every
 * row - that row is also excluded from the "top skill" comparison, since
 * it isn't a real skill. Without it, the total is the sum of every row's
 * delta (skill_levels has no such rollup row, so it's always summed).
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
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
 * Looks up every player's real display-case name from their `skill_levels`
 * history (not just this week's changes) - Dink sends the account's actual
 * capitalization (e.g. "Frosty Dad"), unlike `skill_xp`, which is seeded
 * from the uppercase `theBoys` allowlist (e.g. "FROSTY DAD", built for
 * case-insensitive webhook matching, not display). Used so a player who
 * only gained XP this week (no level-ups) still displays with their real
 * name instead of theBoys' all-caps form.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @returns {Promise<Map<string, string>>} uppercase playername -> real display-case name
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
 * Builds the Levels Board section of the weekly recap: each player's total
 * levels gained (from Dink's level-up events, `skill_levels`) and total XP
 * gained (polled from the public OSRS Hiscores API, `skill_xp`) since the
 * *last* time this ran, alongside the single skill that drove the most of
 * each - not lifetime totals. Total XP Gained comes from the delta on
 * Hiscores' own "Overall" row rather than summing individual skills, since a
 * player can have real XP in a skill they aren't ranked in yet (which never
 * shows up per-skill). A player appears if they gained *either* levels or
 * XP - a maxed/near-maxed skill can rack up real XP with zero level-ups,
 * which Dink alone can't see at all.
 *
 * Unlike every other weekly-recap section, this doesn't use the shared
 * computeAndResetDeltas helper (src/core/recap/deltaTracking.js) - that
 * helper assumes one row per player with named metric columns, but both
 * `skill_levels` and `skill_xp` have one row per player *per skill*. See
 * aggregatePerSkillDeltas above for the shared fetch/diff/reset shape.
 *
 * The Hiscores poll (src/core/recap/hiscoresXp.js) is wrapped in its own
 * try/catch so an outage there can't block the rest of the recap - the XP
 * columns just come back empty that week instead.
 *
 * Recap-only by design - there's no chat command; this data only surfaces
 * here.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
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
    row.topXpSkill
      ? `${row.topXpSkill} ${formatValue(row.topXpDelta)}`
      : '-',
  ]);

  return formatLeaderboardTable('Levels Board', headers, tableRows);
}
