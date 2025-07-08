import { CHAT_REGEX, CHAT_MESSAGE_TYPES } from '../../constants';

export function petGraph(message, playerName, msgMap, URL) {
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

  console.log('ALL_PETS: ', getAllPets());

  let msg;
  if (overallMatch) {
    const time = overallMatch[1];
    msg = `**${playerName}** has achieved a new **Hallowed Sepulchre (Overall)** personal best of **${time}!**`;
  } else if (floorMatch) {
    const floorNumber = floorMatch[1];
    const time = floorMatch[2];
    msg = `**${playerName}** has achieved a new **Hallowed Sepulchre (Floor ${floorNumber})** personal best of **${time}!**`;
  }

  if (msg) {
    msgMap.set({ ID: CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST, URL }, msg);
  }
}
