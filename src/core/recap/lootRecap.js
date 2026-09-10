import { formatValue, formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the loot section: value gained since last time, plus the single
 * most valuable drop this week (reset to NULL each run, not diffed).
 * Recap-only - no chat command.
 * @param {*} WEEKLY_RECAP_DB
 * @returns {Promise<string|null>}
 */
export async function buildLootWeeklyChangeSection(WEEKLY_RECAP_DB) {
  const changes = await computeAndResetDeltas(WEEKLY_RECAP_DB, {
    table: 'loot_totals',
    extraColumns: ['weekly_top_item_name', 'weekly_top_item_value'],
    metrics: [
      {
        current: 'total_value',
        baseline: 'total_value_baseline',
        key: 'value',
      },
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
