import { formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the pets section of the weekly recap: pets gained since last time,
 * plus the most recent pet. Recap-only - no chat command.
 * @param {*} PETS_DB
 * @returns {Promise<string|null>}
 */
export async function buildPetsWeeklyChangeSection(PETS_DB) {
  const changes = await computeAndResetDeltas(PETS_DB, {
    table: 'pets',
    extraColumns: ['most_recent_pet_name'],
    metrics: [
      { current: 'total_pets', baseline: 'total_pets_baseline', key: 'pets' },
    ],
  });
  if (!changes || changes.length === 0) return null;

  const sorted = changes.sort((a, b) => b.petsDelta - a.petsDelta);

  const headers = ['Name', 'Pets Gained', 'Recent Pet'];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.petsDelta.toLocaleString('en-US'),
    row.most_recent_pet_name ?? '-',
  ]);

  return formatLeaderboardTable('Pet Board', headers, tableRows);
}
