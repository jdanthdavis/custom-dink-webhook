import { formatValue, formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the deaths section: deaths and GP lost since last time. Recap-only
 * - no chat command.
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
      {
        current: 'total_value_lost',
        baseline: 'total_value_lost_baseline',
        key: 'gpLost',
      },
    ],
  });
  if (!changes || changes.length === 0) return null;

  const sorted = changes.sort((a, b) => b.deathsDelta - a.deathsDelta);

  const headers = ['Name', 'Deaths', 'GP Lost'];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.deathsDelta.toLocaleString('en-US'),
    formatValue(row.gpLostDelta, true),
  ]);

  return formatLeaderboardTable('Deaths Board', headers, tableRows);
}
