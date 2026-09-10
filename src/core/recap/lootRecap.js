import { formatValue, formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the loot section of the weekly recap: each player's loot value
 * gained since the *last* time this ran, alongside their single most
 * valuable qualifying drop this week - not their lifetime total/most recent
 * drop. A player with no prior baseline (their first drop since this
 * shipped) has their full current total counted as this week's gain.
 * Players with no new qualifying loot since last time are omitted.
 *
 * Recap-only by design - there's no `!Fetchloot` chat command; this data
 * only surfaces here. Existing production rows were backfilled
 * (`total_value_baseline = total_value`) when that column was added, so
 * their pre-existing history doesn't appear as "gained this week" on the
 * first run. weekly_top_item_* isn't a running total like total_value - it's
 * reset to NULL here (rather than diffed against a baseline) so next week's
 * top drop starts fresh.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @returns {Promise<string|null>}
 */
export async function buildLootWeeklyChangeSection(WEEKLY_RECAP_DB) {
  const changes = await computeAndResetDeltas(WEEKLY_RECAP_DB, {
    table: 'loot_totals',
    extraColumns: ['weekly_top_item_name', 'weekly_top_item_value'],
    metrics: [
      { current: 'total_value', baseline: 'total_value_baseline', key: 'value' },
    ],
  });
  if (!changes || changes.length === 0) return null;

  try {
    await WEEKLY_RECAP_DB.prepare(
      `UPDATE loot_totals SET weekly_top_item_name = NULL, weekly_top_item_value = NULL
       WHERE weekly_top_item_value IS NOT NULL`
    ).run();
  } catch (error) {
    console.log(
      'buildLootWeeklyChangeSection reset error:',
      error instanceof Error ? error.message : error
    );
  }

  const sorted = changes.sort((a, b) => b.valueDelta - a.valueDelta);

  const headers = ['Name', 'Total Value Gained', 'Most Valuable Drop'];
  const tableRows = sorted.map((row) => [
    row.playername,
    formatValue(row.valueDelta, true),
    row.weekly_top_item_name
      ? `${row.weekly_top_item_name} ${formatValue(row.weekly_top_item_value)}`
      : '-',
  ]);
  return formatLeaderboardTable('Loot Board', headers, tableRows);
}
