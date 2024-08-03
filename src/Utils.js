const theBoys = [
  'LSX SWAP',
  'MOOREI',
  'GOUT HAVER',
  'GLASSFACE',
  'Z4M',
  'Z4M I',
  'THEMILDEST1',
  'BG S',
];

/**
 *
 * @param {*} bossName
 * @param {*} killCount
 * @param {*} playerName
 * @returns
 */
export function checkKc(bossName, killCount, playerName) {
  const bossMap = new Map([
    ['TZKAL-ZUK', 5],
    ['SOL HEREDIT', 5],
    ['THEATRE OF BLOOD: HARD MODE', 10],
    ['CHAMBERS OF XERIC: CHALLENGE MODE', 10],
    ["PHOSANI'S NIGHTMARE", 25],
    ['THE NIGHTMARE', 25],
    ['CORPOREAL BEAST', 50],
  ]);
  const bossInterval = bossMap.get(bossName?.toUpperCase());

  // if KC is noteable
  if (bossMap.has(bossName?.toUpperCase()) && killCount % bossInterval === 0)
    return true;

  // base bossInterval of 100
  if (killCount % 100 === 0) return true;

  // special occasion
  if (
    (theBoys.includes(playerName?.toUpperCase()) &&
      bossName?.toUpperCase() === 'SOL HEREDIT' &&
      killCount === 1) ||
    (theBoys.includes(playerName?.toUpperCase()) &&
      bossName?.toUpperCase() === 'TZKAL-ZUK' &&
      killCount === 1) ||
    (theBoys.includes(playerName?.toUpperCase()) &&
      bossName?.toUpperCase() === 'TZTOK-JAD' &&
      killCount === 1)
  ) {
    return true;
  }
  return false;
}

/**
 *
 * @param {*} extra
 * @param {*} payloadType
 * @param {*} playerName
 * @param {*} env
 * @returns
 */
export function createFormData(extra, payloadType, playerName, env) {
  const { KC_URL, PB_URL, CHAT_URL, COLLECTION_URL, PET_URL } = env;
  const bossName = extra.boss;
  const killCount = extra.count;
  let msgMap = new Map();

  if (payloadType === 'PET') {
    const petName = extra.petName;
    const milestone = extra.milestone;
    const isDuplicate = extra.duplicate;

    if (isDuplicate) {
      msgMap.set(
        PET_URL,
        `**${playerName}** has a funny feeling like they would have been followed by **${petName}**! | **${milestone}**`
      );
    } else {
      msgMap.set(
        PET_URL,
        `**${playerName}** has a funny feeling like they're being followed by **${petName}**! | **${milestone}**`
      );
    }
  }

  if (payloadType === 'COLLECTION') {
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

    msgMap.set(
      COLLECTION_URL,
      `**${playerName}** has added a new item to their collection log: **${itemName}** | **${completedEntries}/${totalEntries} (${leftHandSize}%)**`
    );
  }

  if (extra?.isPersonalBest) {
    const regex = /[A-Za-z]+/gi;
    const time = extra.time;
    let sanitizedTime = time
      ?.replace('PT', '')
      ?.replace('S', '')
      ?.replaceAll(regex, ':');

    if (sanitizedTime?.includes('.')) {
      const miliSeconds = sanitizedTime.split('.')[1];
      if (miliSeconds.length < 2 && miliSeconds.charAt(1) !== 0) {
        sanitizedTime = sanitizedTime + 0;
      }
    }

    msgMap.set(
      PB_URL,
      `**${playerName}** has defeated **${bossName}** with a new personal best of **${sanitizedTime}**`
    );
  }

  if (payloadType === 'CHAT' && theBoys.includes(playerName?.toUpperCase())) {
    msgMap.set(CHAT_URL, `**${playerName}** just balled someone!`);
  }

  if (
    payloadType === 'KILL_COUNT' &&
    checkKc(bossName, killCount, playerName)
  ) {
    msgMap.set(
      KC_URL,
      `**${playerName}** has defeated **${bossName}** with a completion count of **${killCount}**`
    );
  }

  return msgMap;
}
