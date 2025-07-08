import { grumblerCheck, formatAsPercentage } from './helperFunctions';
import { ALL_PETS, PET } from '../constants';

/**
 * Gathers the pet information
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information. See {@link https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#pets} for all the information.
 * @param {*} URL - The associated URL
 */
async function petHandler(msgMap, playerName, extra, MONGO_MIDDLEWARE, URL) {
  const { milestone, duplicate: isDuplicate, petName } = extra;
  const validatedPetName = grumblerCheck(petName);

  async function getTotalPets(playername) {
    const url = `${MONGO_MIDDLEWARE}/get-pets?playername=${encodeURIComponent(
      playername
    )}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`/get-pets response status: ${res.status}`);
      }

      const json = await res.json();
      // Extract updated totalPets field
      return json.player?.totalPets ? Number(json.player.totalPets) : null;
    } catch (error) {
      console.log('getTotalPets ', error.message);
      return null;
    }
  }

  async function incrementPetCount(playername, petName) {
    const url = `${MONGO_MIDDLEWARE}/increment-pets`;
    console.log(url);

    const today = new Date();
    // Format as MM/DD/YYYY
    const formattedDate = `${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playername,
          petName,
          dateGot: formattedDate,
        }),
      });

      if (!res.ok)
        throw new Error(`Failed to increment pet count: ${res.status}`);
      const json = await res.json();
      console.log(
        `Pet count and recent pet successfully updated for ${json.playername}`
      );
    } catch (error) {
      console.log('incrementPetCount ', error.message);
    }
  }

  return (async () => {
    if (!isDuplicate) {
      await incrementPetCount(playerName);
    }
    const totalPets = await getTotalPets(playerName);
    const totalPetsPercentage = totalPets
      ? formatAsPercentage(totalPets, ALL_PETS)
      : '';

    // Fallback for when the game message does not contain the pet's name or the milestone it was acquired at.
    if (!validatedPetName || !milestone) {
      const fallbackMsg = isDuplicate
        ? `**${playerName}** has a funny feeling like they would have been followed! ${
            totalPets
              ? `| **${totalPets}/${ALL_PETS} (${totalPetsPercentage}%)**`
              : ''
          }\n-# Pet name or milestone missing!`
        : `**${playerName}** has a funny feeling like they're being followed! ${
            totalPets
              ? `| **${totalPets}/${ALL_PETS} (${totalPetsPercentage}%)**`
              : ''
          }\n-# Pet name or milestone missing!`;

      msgMap.set({ ID: PET, URL }, fallbackMsg);
      return msgMap;
    }

    // Happy path with all information.
    const msg = isDuplicate
      ? `**${playerName}** has a funny feeling like they would have been followed by **${validatedPetName}** at **${milestone}!** ${
          totalPets
            ? `| **${totalPets}/${ALL_PETS} (${totalPetsPercentage}%)**`
            : ''
        }`
      : `**${playerName}** has a funny feeling like they're being followed by **${validatedPetName}** at **${milestone}!** ${
          totalPets
            ? `| **${totalPets}/${ALL_PETS} (${totalPetsPercentage}%)**`
            : ''
        }`;

    msgMap.set({ ID: PET, URL }, msg);

    return msgMap;
  })();
}

export default petHandler;
