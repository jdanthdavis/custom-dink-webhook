import { formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the pets section of the weekly recap: each player's pets gained
 * since the *last* time this ran, alongside their most recent pet - not
 * their lifetime total. A player with no prior baseline (their first pet
 * since this shipped) has their full current total counted as this week's
 * gain. Players with no new pets since last time are omitted.
 *
 * Recap-only by design - there's no `!Fetchpets` chat command; this data
 * only surfaces here. Existing production rows were backfilled
 * (`total_pets_baseline = total_pets`) when that column was added, so their
 * pre-existing history doesn't appear as "gained this week" on the first run.
 * @param {*} PETS_DB - D1 database binding for pet tracking
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
