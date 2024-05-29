export default function checkKc(bossName, killCount, playerName) {
  const bossMap = new Map([
    ['TZKAL-ZUK', 5],
    ['SOL HEREDIT', 5],
    ['THEATRE OF BLOOD HARD MORE', 10],
    ['CHAMBERS OF XERIC CHALLENGE MODE', 10],
    ['SARACHNIS', 1], //! Remove after testing
  ]);
  const bossInterval = bossMap.get(bossName.toUpperCase());

  // if KC is noteable
  if (bossMap.has(bossName.toUpperCase()) && bossInterval % killCount === 0)
    return true;

  // base bossInterval of 100
  if (killCount % 100 === 0) return true;

  // special occasion
  if (
    (playerName === 'Gout Haver' &&
      bossName === 'SOL HEREDIT' &&
      killCount === 1) ||
    (playerName === 'bg s' && bossName === 'TZKAL-ZUK' && killCount === 1)
  ) {
    return true;
  }
  return false;
}
