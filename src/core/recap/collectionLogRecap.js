import { formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the collection log section: entries completed since last time.
 * Recap-only - no chat command.
 * @param {*} WEEKLY_RECAP_DB
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
