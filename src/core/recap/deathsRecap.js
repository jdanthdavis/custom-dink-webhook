import { formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the deaths section: deaths since last time. Recap-only - no chat
 * command.
 * @param {*} WEEKLY_RECAP_DB
 * @returns {Promise<string|null>}
 */
export async function buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB) {
  const changes = await computeAndResetDeltas(WEEKLY_RECAP_DB, {
    table: 'deaths',
    metrics: [
      {
        current: 'death_count',
        baseline: 'death_count_baseline',
        key: 'deaths',
      },
    ],
  });
  if (!changes || changes.length === 0) return null;

  const sorted = changes.sort((a, b) => b.deathsDelta - a.deathsDelta);

  const headers = ['Name', 'Deaths'];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.deathsDelta.toLocaleString('en-US'),
  ]);

  return formatLeaderboardTable('Deaths Board', headers, tableRows);
}
