import { formatValue, formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the deaths section of the weekly recap: each player's deaths and
 * GP lost since the *last* time this ran, not a lifetime total. A player
 * with no prior baseline (their first death since this shipped) has their
 * full current count/value counted as this week's total. Players with no
 * deaths since last time are omitted.
 *
 * Recap-only by design - there's no chat command; this data only surfaces
 * here.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @returns {Promise<string|null>}
 */
export async function buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB) {
  const changes = await computeAndResetDeltas(WEEKLY_RECAP_DB, {
    table: 'deaths',
    metrics: [
      { current: 'death_count', baseline: 'death_count_baseline', key: 'deaths' },
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

  return formatLeaderboardTable('Deaths (This Week)', headers, tableRows);
}
