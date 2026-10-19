import { formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the pets section of the weekly recap: pets gained since last time
 * and the names of those pets, oldest to newest (weekly_pet_names - appended
 * as each pet arrives, reset to NULL each run, not diffed). Recap-only - no
 * chat command.
 * @param {*} PETS_DB
 * @returns {Promise<string|null>}
 */
export async function buildPetsWeeklyChangeSection(PETS_DB) {
  const changes = await computeAndResetDeltas(PETS_DB, {
    table: 'pets',
    extraColumns: ['weekly_pet_names'],
    metrics: [
      { current: 'total_pets', baseline: 'total_pets_baseline', key: 'pets' },
    ],
  });
  if (!changes || changes.length === 0) return null;

  try {
    await PETS_DB.prepare(
      `UPDATE pets SET weekly_pet_names = NULL WHERE weekly_pet_names IS NOT NULL`
    ).run();
  } catch (error) {
    console.log(
      'buildPetsWeeklyChangeSection reset error:',
      error instanceof Error ? error.message : error
    );
  }

  const sorted = changes.sort((a, b) => b.petsDelta - a.petsDelta);

  const headers = ['Name', 'Pets Gained', 'Pets Got'];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.petsDelta.toLocaleString('en-US'),
    row.weekly_pet_names ?? '-',
  ]);

  return formatLeaderboardTable('Pet Board', headers, tableRows);
}
