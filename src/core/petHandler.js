import { grumblerCheck, formatAsPercentage } from './helperFunctions';
import { ALL_PETS, PET, PET_MILESTONE_MAP } from '../constants';

/**
 * Gathers the pet information
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information. See {@link https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#pets} for all the information.
 * @param {*} URL - The associated URL
 */
async function petHandler(msgMap, playerName, extra, MONGO_MIDDLEWARE, URL) {
  const {
    milestone: initialMilestone,
    duplicate: isDuplicate,
    petName,
  } = extra;
  const validatedPetName = PET_MILESTONE_MAP[grumblerCheck(petName)];
  let milestone = validatedPetName
    ? initialMilestone.replace(validatedPetName[0], validatedPetName[1])
    : initialMilestone;

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
      return json.player?.totalPets != null
        ? Number(json.player.totalPets)
        : null;
    } catch (error) {
      console.log('getTotalPets ', error.message);
      return null;
    }
  }

  async function incrementPetCount(playername, petName) {
    const url = `${MONGO_MIDDLEWARE}/increment-pets`;
    const today = new Date();
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
      await incrementPetCount(playerName, validatedPetName);
    }
    const totalPets = await getTotalPets(playerName);
    const totalPetsPercentage = totalPets
      ? formatAsPercentage(totalPets, ALL_PETS)
      : '';
    if (!validatedPetName || !milestone) {
      const fallbackMsg = isDuplicate
        ? `**${playerName}** has a funny feeling like they would have been followed! ${
            totalPets
              ? `| **${totalPets}/${ALL_PETS} (${totalPetsPercentage}%)**`
              : ''
          }
-# Pet name or milestone missing!`
        : `**${playerName}** has a funny feeling like they're being followed! ${
            totalPets
              ? `| **${totalPets}/${ALL_PETS} (${totalPetsPercentage}%)**`
              : ''
          }
-# Pet name or milestone missing!`;
      msgMap.set({ ID: PET, URL }, fallbackMsg);
      return msgMap;
    }
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
