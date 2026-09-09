import { customBossNames, formatAsPercentage, formatDate, getSingleColumn } from './helperFunctions';
import { ALL_PETS, PET, THE_GRUMBLER } from '../constants';

/**
 * Gathers the pet information
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information. See {@link https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#pets} for all the information.
 * @param {*} PETS_DB - D1 database binding for pet tracking
 * @param {*} URL - The associated URL
 */
async function petHandler(msgMap, playerName, extra, PETS_DB, URL) {
  const {
    milestone: initialMilestone,
    duplicate: isDuplicate,
    petName,
  } = extra;
  const validatedPetName = customBossNames(petName);
  let milestone =
    validatedPetName === THE_GRUMBLER
      ? initialMilestone.replace('killcount', 'grumbles')
      : initialMilestone;

  /** @param {string} playername */
  async function getTotalPets(playername) {
    return getSingleColumn(PETS_DB, 'pets', 'total_pets', playername, 'getTotalPets');
  }

  /** @param {string} playername @param {string} petName */
  async function incrementPetCount(playername, petName) {
    const formattedDate = formatDate();

    try {
      await PETS_DB.prepare(
        `INSERT INTO pets (playername, total_pets, most_recent_pet_name, most_recent_pet_date)
         VALUES (?1, 1, ?2, ?3)
         ON CONFLICT(playername) DO UPDATE SET
           total_pets = total_pets + 1,
           most_recent_pet_name = COALESCE(?2, most_recent_pet_name),
           most_recent_pet_date = COALESCE(?3, most_recent_pet_date)`
      )
        .bind(playername, petName || null, petName ? formattedDate : null)
        .run();
      console.log(
        `Pet count and recent pet successfully updated for ${playername}`
      );
    } catch (error) {
      console.log(
        'incrementPetCount ',
        error instanceof Error ? error.message : error
      );
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
