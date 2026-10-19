import {
  customBossNames,
  formatAsPercentage,
  formatDate,
  getSingleColumn,
  runD1Write,
} from './helperFunctions';
import { ALL_PETS, PET, THE_GRUMBLER } from '../constants';
import { PET_TOTAL, recordBigAchievements } from './bigAchievements';

/**
 * Formats a pet-drop notification and increments the player's pet count.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap
 * @param {*} playerName
 * @param {*} extra - see {@link https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#pets}
 * @param {*} PETS_DB
 * @param {*} URL
 * @param {*} [WEEKLY_RECAP_DB] - where pet-total big achievements are recorded
 */
async function petHandler(
  msgMap,
  playerName,
  extra,
  PETS_DB,
  URL,
  WEEKLY_RECAP_DB
) {
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

    await runD1Write(PETS_DB, {
      label: 'incrementPetCount',
      // weekly_pet_names appends this pet to the recap's "Pets Got" list
      // (reset each recap run); a missing name leaves the list untouched.
      sql: `INSERT INTO pets (playername, total_pets, most_recent_pet_name, most_recent_pet_date, weekly_pet_names)
            VALUES (?1, 1, ?2, ?3, ?2)
            ON CONFLICT(playername) DO UPDATE SET
              total_pets = total_pets + 1,
              most_recent_pet_name = COALESCE(?2, most_recent_pet_name),
              most_recent_pet_date = COALESCE(?3, most_recent_pet_date),
              weekly_pet_names = CASE
                WHEN ?2 IS NULL THEN weekly_pet_names
                WHEN weekly_pet_names IS NULL THEN ?2
                ELSE weekly_pet_names || ', ' || ?2
              END`,
      values: [playername, petName || null, petName ? formattedDate : null],
    });
  }

  return (async () => {
    if (!isDuplicate) {
      await incrementPetCount(playerName, validatedPetName);
    }
    const totalPets = await getTotalPets(playerName);
    // Only a new (non-duplicate) pet can move the total onto a milestone.
    if (WEEKLY_RECAP_DB && !isDuplicate && totalPets) {
      await recordBigAchievements(
        WEEKLY_RECAP_DB,
        PET_TOTAL,
        playerName,
        { totalPets },
        undefined
      );
    }
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
