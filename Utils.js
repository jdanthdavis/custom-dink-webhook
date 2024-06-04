export default function checkKc(bossName, killCount, playerName) {
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
  const bossMap = new Map([
    ['TZKAL-ZUK', 5],
    ['SOL HEREDIT', 5],
    ['THEATRE OF BLOOD HARD MODE', 10],
    ['CHAMBERS OF XERIC CHALLENGE MODE', 10],
    ["PHOSANI'S NIGHTMARE", 25],
    ['THE NIGHTMARE', 25],
    ['CORPOREAL BEAST', 50],
  ]);
  const bossInterval = bossMap.get(bossName.toUpperCase());

  // if KC is noteable
  if (bossMap.has(bossName.toUpperCase()) && killCount % bossInterval === 0)
    return true;

  // base bossInterval of 100
  if (killCount % 100 === 0) return true;

  // special occasion
  if (
    (theBoys.includes(playerName.toUpperCase()) &&
      bossName.toUpperCase() === 'SOL HEREDIT' &&
      killCount === 1) ||
    (theBoys.includes(playerName.toUpperCase()) &&
      bossName.toUpperCase() === 'TZKAL-ZUK' &&
      killCount === 1) ||
    (theBoys.includes(playerName.toUpperCase()) &&
      bossName.toUpperCase() === 'TZTOK-JAD' &&
      killCount === 1)
  ) {
    return true;
  }
  return false;
}
