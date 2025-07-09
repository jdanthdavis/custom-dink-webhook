import { CHAT_MESSAGE_TYPES } from '../../constants';

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
      console.log('getPets error:', error.message);
      return null;
    }
  }

  function formatPlayersList(players) {
    // Sort entries by totalPets descending
    const entries = Object.entries(players).sort(([, aData], [, bData]) => {
      return (Number(bData.totalPets) || 0) - (Number(aData.totalPets) || 0);
    });

    const lines = entries.map(([name, data]) => {
      const totalPets = Number(data.totalPets) || '-';
      const recentPetName = data.mostRecentPet?.name ?? '-';
      const recentPetDate = data.mostRecentPet?.dateGot ?? '-';
      return `**${name}** -> Total Pets: **${totalPets}** -> Most Recent: **${recentPetName}** on **${recentPetDate}**`;
    });

    return lines.join('\n');
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
