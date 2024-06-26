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
 * @param bossName
 * @param killCount
 * @param playerName
 * @returns
 */
export function checkKc(bossName, killCount, playerName) {
  console.log('would run checkKC');

  const bossMap = new Map([
    ['TZKAL-ZUK', 5],
    ['SOL HEREDIT', 5],
    ['THEATRE OF BLOOD HARD MODE', 10],
    ['CHAMBERS OF XERIC CHALLENGE MODE', 10],
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
 * @param bossName
 * @param killCount
 * @param playerName
 * @param time
 * @param isPb
 * @param env
 * @returns
 */
export function createFormData(
  bossName,
  killCount,
  playerName,
  time,
  isPb,
  isChatting,
  env
) {
  const { KC_URL, PB_URL, CHAT_URL } = env;
  let msgMap = new Map();
  const regex = /[A-Za-z]+/gi;
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

  console.log('TIME - ', time);
  console.log('SANITIZEDTIME - ', sanitizedTime);

  if (isPb) {
    msgMap.set(
      PB_URL,
      `**${playerName}** has defeated **${bossName}** with a new personal best of **${sanitizedTime}**`
    );
  }

  if (isChatting && theBoys.includes(playerName?.toUpperCase())) {
    msgMap.set(CHAT_URL, `**${playerName}** just balled someone!`);
  }

  if (checkKc(bossName, killCount, playerName)) {
    msgMap.set(
      KC_URL,
      `**${playerName}** has defeated **${bossName}** with a completion count of **${killCount}**`
    );
  }

  return msgMap;
}
