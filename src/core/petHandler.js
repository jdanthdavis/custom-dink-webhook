import {
  customBossNames,
  formatAsPercentage,
  formatDate,
  getSingleColumn,
  runD1Write,
  escapeSqlString,
} from './helperFunctions';
import { ALL_PETS, PET, THE_GRUMBLER } from '../constants';

/**
 * Formats a pet-drop notification and increments the player's pet count.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap
 * @param {*} playerName
 * @param {*} extra - see {@link https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#pets}
 * @param {*} PETS_DB
 * @param {*} URL
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
    return getSingleColumn(
      PETS_DB,
      'pets',
      'total_pets',
      playername,
      'getTotalPets'
    );
  }

  /** @param {string} playername @param {string} petName */
  async function incrementPetCount(playername, petName) {
    const formattedDate = formatDate();

    await runD1Write(
      () =>
        PETS_DB.prepare(
          `INSERT INTO pets (playername, total_pets, most_recent_pet_name, most_recent_pet_date)
           VALUES (?1, 1, ?2, ?3)
           ON CONFLICT(playername) DO UPDATE SET
             total_pets = total_pets + 1,
             most_recent_pet_name = COALESCE(?2, most_recent_pet_name),
             most_recent_pet_date = COALESCE(?3, most_recent_pet_date)`
        )
          .bind(playername, petName || null, petName ? formattedDate : null)
          .run(),
      {
        label: 'incrementPetCount',
        buildFixSql: () => {
          const nameSql = petName ? `'${escapeSqlString(petName)}'` : 'NULL';
          const dateSql = petName ? `'${formattedDate}'` : 'NULL';
          return (
            `INSERT INTO pets (playername, total_pets, most_recent_pet_name, most_recent_pet_date) ` +
            `VALUES ('${escapeSqlString(playername)}', 1, ${nameSql}, ${dateSql}) ` +
            `ON CONFLICT(playername) DO UPDATE SET total_pets = total_pets + 1, ` +
            `most_recent_pet_name = COALESCE(${nameSql}, most_recent_pet_name), ` +
            `most_recent_pet_date = COALESCE(${dateSql}, most_recent_pet_date);`
          );
        },
      }
    );
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
