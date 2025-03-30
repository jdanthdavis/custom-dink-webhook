/**
 * Adds the correct wording for specific kill count messages
 * @param {*} playerName
 * @param {*} gameMessage
 * @param {*} bossName
 * @returns
 */
function KillCountMsgConstructor(playerName, gameMessage, bossName, killCount) {
  const primary_regex =
    /Your (?<key>.+)\s(?<type>kill|chest|completion|harvest)\s?count is: [\d,]+\b/i;
  const secondary_regex =
    /Your (?<type>completed|subdued) (?<key>.+?) count is: [\d,]+\b/i;

  const primaryMatch = gameMessage.match(primary_regex);
  const secondaryMatch = gameMessage.match(secondary_regex);

  let fallBackType = 'completion';

  if (primaryMatch) {
    fallBackType = primaryMatch.groups.type;
  } else if (secondaryMatch) {
    fallBackType = secondaryMatch.groups.type;
  }

  return `**${playerName}** has defeated **${bossName}** with a ${fallBackType} count of **${killCount}!**`;
}

export default KillCountMsgConstructor;
