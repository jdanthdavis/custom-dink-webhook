export async function petGraph(message, playerName, msgMap, URL) {
  async function getAllPets() {
    const url = `${MONGO_MIDDLEWARE}/get-pets`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`/get-pets response status: ${res.status}`);
      }

      const json = await res.json();
      return json.players; // This will be the whole players object
    } catch (error) {
      console.log('getAllPets ', error.message);
      return null;
    }
  }

  function formatPlayers(players) {
    let lines = ['**All Pets Scores**'];
    for (const [player, score] of Object.entries(players)) {
      lines.push(`${player}: ${score}`);
    }
    return lines.join('\n');
  }

  // ✅ Await the async function
  const allPlayers = await getAllPets();

  if (allPlayers) {
    const formatted = formatPlayers(allPlayers);
    console.log(formatted);
  } else {
    console.log('No players data found.');
  }
}
