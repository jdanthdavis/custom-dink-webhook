import { formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the collection log section of the weekly recap: each player's
 * entries completed since the *last* time this ran - not their lifetime
 * total. A player with no prior baseline (their first cycled log since this
 * shipped) has their full current count counted as this week's total.
 * Players with no new entries since last time are omitted.
 *
 * Recap-only by design - there's no chat command; this data only surfaces
 * here.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @returns {Promise<string|null>}
 */
export async function buildCollectionLogWeeklyChangeSection(WEEKLY_RECAP_DB) {
  const changes = await computeAndResetDeltas(WEEKLY_RECAP_DB, {
    table: 'collection_log',
    metrics: [
      {
        current: 'completed_entries',
        baseline: 'completed_entries_baseline',
        key: 'entries',
      },
    ],
  });
  if (!changes || changes.length === 0) return null;

  const sorted = changes.sort((a, b) => b.entriesDelta - a.entriesDelta);

  const headers = ['Name', 'Completed Logs'];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.entriesDelta.toLocaleString('en-US'),
  ]);

  return formatLeaderboardTable('Collection Logs Board', headers, tableRows);
}
