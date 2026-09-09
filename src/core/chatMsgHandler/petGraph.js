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
