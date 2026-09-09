import { CHAT_MESSAGE_TYPES } from '../../constants';
import { formatLeaderboardTable } from '../helperFunctions';

/**
 * Fetches every tracked player's pet stats, sorted by total pets descending.
 * Reused by both the `!Fetchpets` leaderboard and the weekly recap.
 * @param {*} PETS_DB - D1 database binding for pet tracking
 * @returns {Promise<Array<{ playername: string, total_pets?: number, most_recent_pet_name?: string, most_recent_pet_date?: string }>|null>}
 */
export async function getAllPets(PETS_DB) {
  try {
    const { results } = await PETS_DB.prepare(
      'SELECT playername, total_pets, most_recent_pet_name, most_recent_pet_date FROM pets'
    ).all();
    return results?.sort(
      (a, b) => (Number(b.total_pets) || 0) - (Number(a.total_pets) || 0)
    );
  } catch (error) {
    console.log('getAllPets error:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Fetches and formats the full pet leaderboard as a titled table, or null if
 * no player has any tracked pets. Reused by both `!Fetchpets` and the weekly
 * recap, so both surfaces always agree.
 * @param {*} PETS_DB - D1 database binding for pet tracking
 * @returns {Promise<string|null>}
 */
export async function getPetsLeaderboard(PETS_DB) {
  const rows = await getAllPets(PETS_DB);
  if (!rows || rows.length === 0) return null;

  const headers = ['Name', '# of Pets', 'Recent Pet', 'Date Acquired'];
  const tableRows = rows.map((row) => [
    row.playername,
    String(Number(row.total_pets) || '-'),
    row.most_recent_pet_name ?? '-',
    row.most_recent_pet_date ?? '-',
  ]);
  return formatLeaderboardTable('Pet Board', headers, tableRows);
}

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

/**
 * Handles the "!Fetchpets" chat command, reporting either a single player's
 * pet stats or a leaderboard of all tracked players.
 * @param {string} message - The raw chat message text
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} URL - The associated URL
 * @param {*} PETS_DB - D1 database binding for pet tracking
 */
export async function petGraph(message, msgMap, URL, PETS_DB) {
  const commandPrefix = '!Fetchpets';

  // Extract everything after "!Fetchpets" (case insensitive)
  let singlePlayerName = null;

  if (message.toLowerCase().startsWith(commandPrefix.toLowerCase())) {
    singlePlayerName = message.slice(commandPrefix.length).trim();
  }

  if (singlePlayerName === '') {
    singlePlayerName = null;
  }

  /** @param {string} playername */
  async function getPlayerPets(playername) {
    try {
      return await PETS_DB.prepare(
        'SELECT playername, total_pets, most_recent_pet_name, most_recent_pet_date FROM pets WHERE playername = ?'
      )
        .bind(playername)
        .first();
    } catch (error) {
      console.log('getPlayerPets error:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  if (singlePlayerName) {
    const row = await getPlayerPets(singlePlayerName);
    if (!row) {
      console.log('Player not found or no data');
      return;
    }

    const totalPets = Number(row.total_pets) || '-';
    const recentPetName = row.most_recent_pet_name ?? '-';
    const recentPetDate = row.most_recent_pet_date ?? '-';

    const formatted = `**${row.playername}** -> Total Pets: **${totalPets}** -> Most Recent: **${recentPetName}** on **${recentPetDate}**`;
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.FETCH_PETS, URL }, formatted);
  } else {
    const formatted = await getPetsLeaderboard(PETS_DB);
    if (!formatted) {
      console.log('No players data found.');
      return;
    }

    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.FETCH_PETS, URL }, formatted);
  }
}
