import { CHAT_MESSAGE_TYPES } from '../../constants';

/**
 * Handles the "!Fetchpets" chat command, reporting either a single player's
 * pet stats or a leaderboard of all tracked players.
 * @param {string} message - The raw chat message text
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} URL - The associated URL
 * @param {string} MONGO_MIDDLEWARE - The pet-tracking middleware base URL
 */
export async function petGraph(message, msgMap, URL, MONGO_MIDDLEWARE) {
  const commandPrefix = '!Fetchpets';

  // Extract everything after "!Fetchpets" (case insensitive)
  let singlePlayerName = null;

  if (message.toLowerCase().startsWith(commandPrefix.toLowerCase())) {
    singlePlayerName = message.slice(commandPrefix.length).trim();
  }

  if (singlePlayerName === '') {
    singlePlayerName = null;
  }

  /** @param {string|null} player */
  async function getPets(player) {
    const url = player
      ? `${MONGO_MIDDLEWARE}/get-pets?playername=${encodeURIComponent(player)}`
      : `${MONGO_MIDDLEWARE}/get-pets`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`/get-pets response status: ${res.status}`);
      }
      const json = await res.json();
      return json; // Return full JSON so we can access properName and data
    } catch (error) {
      console.log('getPets error:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /** @param {Object<string, { totalPets?: number, mostRecentPet?: { name?: string, dateGot?: string } }>} players */
  function formatPlayersList(players) {
    // Sort entries by totalPets descending
    const entries = Object.entries(players).sort(([, aData], [, bData]) => {
      return (Number(bData.totalPets) || 0) - (Number(aData.totalPets) || 0);
    });

    const headers = ['Name', '# of Pets', 'Recent Pet', 'Date Acquired'];

    const rows = entries.map(([name, data]) => {
      const totalPets = String(Number(data.totalPets) || '-');
      const recentPetName = data.mostRecentPet?.name ?? '-';
      const recentPetDate = data.mostRecentPet?.dateGot ?? '-';
      return [name, totalPets, recentPetName, recentPetDate];
    });

    // Auto-size each column to fit its header and the longest value below it
    const widths = headers.map((header, col) =>
      Math.max(header.length, ...rows.map((row) => row[col].length))
    );

    /** @param {string[]} cells */
    const padRow = (cells) =>
      cells.map((cell, col) => cell.padEnd(widths[col])).join('  ').trimEnd();

    const headerLine = padRow(headers);
    const separatorLine = widths.map((w) => '-'.repeat(w)).join('  ').trimEnd();
    const rowLines = rows.map((row) => padRow(row));

    const table = [headerLine, separatorLine, ...rowLines].join('\n');

    return `**Pet Board**\n\`\`\`\n${table}\n\`\`\``;
  }

  if (singlePlayerName) {
    const playerRes = await getPets(singlePlayerName);
    if (!playerRes || !playerRes.player) {
      console.log('Player not found or no data');
      return;
    }

    const properName = playerRes.properName || singlePlayerName;
    const playerData = playerRes.player;

    const totalPets = Number(playerData.totalPets) || '-';
    const recentPetName = playerData.mostRecentPet?.name ?? '-';
    const recentPetDate = playerData.mostRecentPet?.dateGot ?? '-';

    const formatted = `**${properName}** -> Total Pets: **${totalPets}** -> Most Recent: **${recentPetName}** on **${recentPetDate}**`;
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.FETCH_PETS, URL }, formatted);
  } else {
    const allPlayersRes = await getPets(null);
    if (!allPlayersRes || !allPlayersRes.players) {
      console.log('No players data found.');
      return;
    }

    const allPlayers = allPlayersRes.players;
    const formatted = formatPlayersList(allPlayers);
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.FETCH_PETS, URL }, formatted);
  }
}
