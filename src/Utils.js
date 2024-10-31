import * as Constants from './constants.js';
import {
  checkKc,
  grumblerCheck,
  sanitizedTime,
  totalLevelCheck,
} from './utils/Index.js';

/**
 * Creates the formData payload to send to a URL
 * @param {*} extra
 * @param {*} payloadType
 * @param {*} playerName
 * @param {*} env
 * @param {*} extra
 * @param {*} payloadType
 * @param {*} playerName
 * @param {*} env
 * @returns
 */
export function createFormData(extra, payloadType, playerName, env) {
  const { KC_URL, PB_URL, COLLECTION_URL, PET_URL, LEVEL_URL, TEST_URL } = env;
  const bossName = extra?.boss;
  const killCount = extra?.count;
  let msgMap = new Map();

  if (payloadType === Constants.PET) {
    const petName = extra?.petName;
    const milestone = extra?.milestone;
    const isDuplicate = extra?.duplicate;

    if (!petName || !milestone) {
      // Need this fallback in case the game broadcast doesn't include the pet name or milestone
      msgMap.set(
        { ID: 'PET', URL: PET_URL },
        `**${playerName}** has a funny feeling like they would have been followed!\n-# Unable to fetch pet name and milestone!`
      );
    } else {
      if (isDuplicate) {
        msgMap.set(
          { ID: 'PET', URL: TEST_URL },
          `**${playerName}** has a funny feeling like they would have been followed by **${grumblerCheck(
            petName
          )}**! | **${milestone}**`
        );
      } else {
        msgMap.set(
          { ID: 'PET', URL: PET_URL },
          `**${playerName}** has a funny feeling like they're being followed by **${grumblerCheck(
            petName
          )}**! | **${milestone}**`
        );
      }
    }
  }

  if (payloadType === Constants.COLLECTION) {
    const totalEntries = extra?.totalEntries;
    const completedEntries = extra?.completedEntries;
    const itemName = extra?.itemName;
    const percentageCompleted = (completedEntries / totalEntries) * 100;
    let leftHandSize = percentageCompleted.toString().split('.')[0];

    if (leftHandSize?.length === 1) {
      leftHandSize = percentageCompleted.toString().slice(0, 4);
    } else if (leftHandSize?.length === 2 || leftHandSize?.length === 3) {
      leftHandSize = percentageCompleted.toString().slice(0, 5);
    }

    if (!totalEntries || !completedEntries) {
      // If the user hasn't cycled their collection log we will use this fallback to prevent errors
      msgMap.set(
        { ID: 'COLLECTION_LOG', URL: COLLECTION_URL },
        `**${playerName}** has added a new item to their collection log: **${grumblerCheck(
          itemName
        )}**\n-# Unable to fetch total and completed entries. Cycle through all tabs in your collection log to fix this!
        `
      );
    } else {
      msgMap.set(
        { ID: 'COLLECTION_LOG', URL: COLLECTION_URL },
        `**${playerName}** has added a new item to their collection log: **${grumblerCheck(
          itemName
        )}** | **${completedEntries}/${totalEntries} (${leftHandSize}%)**`
      );
    }
  }

  if (extra?.isPersonalBest) {
    const time = sanitizedTime(extra?.time);

    msgMap.set(
      { ID: 'PB', URL: PB_URL },
      `**${playerName}** has defeated **${grumblerCheck(
        bossName
      )}** with a new personal best of **${time}**`
    );
  }

  if (
    payloadType === Constants.KILL_COUNT &&
    checkKc(bossName, killCount, playerName)
  ) {
    // Pulls the killCount from the actual game message and formats the message
    const formattedKC = extra?.gameMessage?.split(': ')[1]?.replace('.', '!');

    msgMap.set(
      { ID: 'KILL_COUNT', URL: KC_URL },
      `**${playerName}** has defeated **${grumblerCheck(
        bossName
      )}** with a completion count of **${formattedKC}**`
    );
  }

  if (payloadType === Constants.LEVEL) {
    totalLevelCheck(msgMap, extra?.allSkills, extra?.levelledSkills);
  }
  return msgMap;
}
