import { CHAT_MESSAGE_TYPES } from '../../constants';

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

  async function getAllPets() {
    try {
      const { results } = await PETS_DB.prepare(
        'SELECT playername, total_pets, most_recent_pet_name, most_recent_pet_date FROM pets'
      ).all();
      return results;
    } catch (error) {
      console.log('getAllPets error:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /** @param {Array<{ playername: string, total_pets?: number, most_recent_pet_name?: string, most_recent_pet_date?: string }>} rows */
  function formatPlayersList(rows) {
    // Sort by total_pets descending
    const sorted = [...rows].sort(
      (a, b) => (Number(b.total_pets) || 0) - (Number(a.total_pets) || 0)
    );

    const headers = ['Name', '# of Pets', 'Recent Pet', 'Date Acquired'];

    const tableRows = sorted.map((row) => [
      row.playername,
      String(Number(row.total_pets) || '-'),
      row.most_recent_pet_name ?? '-',
      row.most_recent_pet_date ?? '-',
    ]);

    // Auto-size each column to fit its header and the longest value below it
    const widths = headers.map((header, col) =>
      Math.max(header.length, ...tableRows.map((row) => row[col].length))
    );

    /** @param {string[]} cells */
    const padRow = (cells) =>
      cells.map((cell, col) => cell.padEnd(widths[col])).join('  ').trimEnd();

    const headerLine = padRow(headers);
    const separatorLine = widths.map((w) => '-'.repeat(w)).join('  ').trimEnd();
    const rowLines = tableRows.map((row) => padRow(row));

    const table = [headerLine, separatorLine, ...rowLines].join('\n');

    return `**Pet Board**\n\`\`\`\n${table}\n\`\`\``;
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
    const rows = await getAllPets();
    if (!rows || rows.length === 0) {
      console.log('No players data found.');
      return;
    }

    const formatted = formatPlayersList(rows);
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.FETCH_PETS, URL }, formatted);
  }
}
