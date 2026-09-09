import { formatLeaderboardTable } from '../helperFunctions';

/**
 * Builds the pets section of the weekly recap: each player's pets gained
 * since the *last* time this ran, alongside their most recent pet - not
 * their lifetime total. A player with no prior baseline (their first pet
 * since this shipped) has their full current total counted as this week's
 * gain. Players with no new pets since last time are omitted.
 *
 * This has a side effect: it resets every player's baseline to their current
 * total before returning, so the next call's counts are measured from here.
 * Only call this once per recap cycle (via `RECAP_SECTIONS`) - calling it
 * outside that context would zero out real, unreported progress. Existing
 * production rows were backfilled (`total_pets_baseline = total_pets`) when
 * this column was added, so their pre-existing history doesn't appear as
 * "gained this week" on the first run.
 * @param {*} PETS_DB - D1 database binding for pet tracking
 * @returns {Promise<string|null>}
 */
export async function buildPetsWeeklyChangeSection(PETS_DB) {
  /** @type {Array<{ playername: string, total_pets?: number, most_recent_pet_name?: string, total_pets_baseline?: number }>|null} */
  let rows;
  try {
    const { results } = await PETS_DB.prepare(
      'SELECT playername, total_pets, most_recent_pet_name, total_pets_baseline FROM pets'
    ).all();
    rows = results;
  } catch (error) {
    console.log('buildPetsWeeklyChangeSection error:', error instanceof Error ? error.message : error);
    return null;
  }

  if (!rows || rows.length === 0) return null;

  const changes = rows
    .map((row) => ({
      playername: row.playername,
      petsGained: (Number(row.total_pets) || 0) - (Number(row.total_pets_baseline) || 0),
      recentPet: row.most_recent_pet_name ?? '-',
    }))
    .filter((row) => row.petsGained !== 0);

  // Reset baselines to current totals regardless of what was reported above,
  // so next time's counts are measured from this point on.
  try {
    await PETS_DB.prepare(
      'UPDATE pets SET total_pets_baseline = total_pets'
    ).run();
  } catch (error) {
    console.log('buildPetsWeeklyChangeSection reset error:', error instanceof Error ? error.message : error);
  }

  if (changes.length === 0) return null;

  const sorted = changes.sort((a, b) => b.petsGained - a.petsGained);

  const headers = ['Name', 'Pets Gained', 'Recent Pet'];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.petsGained.toLocaleString('en-US'),
    row.recentPet,
  ]);

  return formatLeaderboardTable('Pet Board (This Week)', headers, tableRows);
}
