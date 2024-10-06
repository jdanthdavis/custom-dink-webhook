import * as Constants from './constants.js';

/**
 *
 * @param bossName
 * @param killCount
 * @param playerName
 * @returns
 */
function checkKc(bossName, killCount, playerName) {
  const bossInterval = Constants.bossMap.get(bossName?.toUpperCase());

  // if KC is noteable
  if (
    Constants.bossMap.has(bossName?.toUpperCase()) &&
    killCount % bossInterval === 0
  )
    return true;

  // base bossInterval of 100
  if (killCount % 100 === 0) return true;

  // special occasion
  if (
    (Constants.theBoys.includes(playerName?.toUpperCase()) &&
      bossName?.toUpperCase() === 'SOL HEREDIT' &&
      killCount === 1) ||
    (Constants.theBoys.includes(playerName?.toUpperCase()) &&
      bossName?.toUpperCase() === 'TZKAL-ZUK' &&
      killCount === 1) ||
    (Constants.theBoys.includes(playerName?.toUpperCase()) &&
      bossName?.toUpperCase() === 'TZTOK-JAD' &&
      killCount === 1)
  ) {
    return true;
  }
  return false;
}

/**
 *
 * @param {*} time
 * @returns
 */
function sanitizedTime(time) {
  let cleanedTime = time.replace('PT', '');

  if (cleanedTime.includes('M') && !cleanedTime.includes('S')) {
    // PB that has no seconds
    cleanedTime = cleanedTime.replace('M', ':00');
  } else if (!cleanedTime.includes('M') && cleanedTime.includes('S')) {
    // PB that is only seconds
    cleanedTime = `${cleanedTime.replace('S', '')}s`;
  } else {
    // PB that has both minutes and seconds
    cleanedTime = cleanedTime.replace('M', ':').replace('S', '');

    if (
      cleanedTime.split(':')[1].length === 1 ||
      cleanedTime.split(':').pop().split('.')[0].length === 1
    ) {
      // PB that also has milliseconds
      cleanedTime = cleanedTime.replace(':', ':0');
    }
  }
  return cleanedTime;
}

/**
 *
 * @param bossName
 * @param killCount
 * @param playerName
 * @param time
 * @param isPb
 * @param env
 * @returns
 */
export function createFormData(extra, payloadType, playerName, env) {
  const {
    KC_URL,
    PB_URL,
    CHAT_URL,
    COLLECTION_URL,
    PET_URL,
    LEVEL_URL,
    TEST_URL,
  } = env;
  const bossName = extra.boss;
  const killCount = extra.count;
  let msgMap = new Map();

  if (payloadType === Constants.PET) {
    const petName = extra.petName;
    const milestone = extra.milestone;
    const isDuplicate = extra.duplicate;

    if (!petName || !milestone) {
      // Need this fallback in case the game broadcast doesn't include the pet name or milestone
      msgMap.set(
        { ID: 'PET', URL: PET_URL },
        `**${playerName}** has a funny feeling like they would have been followed!\n-# Unable to fetch pet name and milestone!`
      );
    } else {
      if (isDuplicate) {
        msgMap.set(
          { ID: 'PET', URL: PET_URL },
          `**${playerName}** has a funny feeling like they would have been followed by **${petName}**! | **${milestone}**`
        );
      } else {
        msgMap.set(
          { ID: 'PET', URL: PET_URL },
          `**${playerName}** has a funny feeling like they're being followed by **${petName}**! | **${milestone}**`
        );
      }
    }
  }

  if (payloadType === Constants.COLLECTION) {
    const totalEntries = extra.totalEntries;
    const completedEntries = extra.completedEntries;
    const itemName = extra.itemName;
    const percentageCompleted = (completedEntries / totalEntries) * 100;
    let leftHandSize = percentageCompleted.toString().split('.')[0];

    if (leftHandSize.length === 1) {
      leftHandSize = percentageCompleted.toString().slice(0, 4);
    } else if (leftHandSize.length === 2 || leftHandSize.length === 3) {
      leftHandSize = percentageCompleted.toString().slice(0, 5);
    }

    if (!totalEntries || !completedEntries) {
      msgMap.set(
        { ID: 'COLLECTION_LOG', URL: COLLECTION_URL },
        `**${playerName}** has added a new item to their collection log: **${itemName}**\n-# Unable to fetch total and completed entries. Cycle through all tabs in your collection log to fix this!
        `
      );
    } else {
      msgMap.set(
        { ID: 'COLLECTION_LOG', URL: COLLECTION_URL },
        `**${playerName}** has added a new item to their collection log: **${itemName}** | **${completedEntries}/${totalEntries} (${leftHandSize}%)**`
      );
    }
  }

  if (extra?.isPersonalBest) {
    const time = sanitizedTime(extra.time);

    msgMap.set(
      { ID: 'PB', URL: PB_URL },
      `**${playerName}** has defeated **${bossName}** with a new personal best of **${time}**`
    );
  }

  if (
    payloadType === Constants.KILL_COUNT &&
    checkKc(bossName, killCount, playerName)
  ) {
    const formattedKC = extra.gameMessage.split(': ')[1]?.replace('.', '!');
    msgMap.set(
      { ID: 'KILL_COUNT', URL: KC_URL },
      `**${playerName}** has defeated **${bossName}** with a completion count of **${formattedKC}**`
    );
  }

  if (payloadType === Constants.LEVEL) {
    const levelName = extra.levelledSkills;

    for (const [key, value] of Object.entries(levelName)) {
      if (value === 99) {
        msgMap.set(
          { ID: key, URL: LEVEL_URL },
          `<a:danse:1281063902557241408> @everyone **${playerName}** has levelled **${key} to ${value}** <a:danse:1281063902557241408>`
        );
      } else if (key === 'Fishing') {
        msgMap.set(
          { ID: key, URL: LEVEL_URL },
          `**${playerName}** has levelled **${key} to ${value}** <:fishh:1285367875531575306>`
        );
      } else {
        msgMap.set(
          { ID: key, URL: LEVEL_URL },
          `**${playerName}** has levelled **${key} to ${value}**!`
        );
      }
    }
  }
  return msgMap;
}
