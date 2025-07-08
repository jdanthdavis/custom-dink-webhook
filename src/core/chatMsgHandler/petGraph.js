export async function petGraph(message, playerName, msgMap, URL) {
  async function getAllPets() {
    const url = `${URL}/get-pets`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`/get-pets response status: ${res.status}`);
      }

      const json = await res.json();
      return json.players;
    } catch (error) {
      console.log('getAllPets ', error.message);
      return null;
    }
  }

  const allPlayers = await getAllPets();
  console.log('allPlayers: ', allPlayers);
}
