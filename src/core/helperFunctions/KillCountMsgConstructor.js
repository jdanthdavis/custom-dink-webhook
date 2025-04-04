/**
 * Adds the correct wording for specific kill count messages
 * @param {*} playerName - The player's name
 * @param {string} message - The in-game message
 * @param {*} bossName - The name of the boss
 * @returns {string} - The updated kill count message
 */
function KillCountMsgConstructor(playerName, message, bossName, killCount) {
  const primary_regex =
    /Your (?<key>.+)\s(?<type>kill|chest|completion|harvest)\s?count is: [\d,]+\b/i;
  const secondary_regex =
    /Your (?<type>completed|subdued) (?<key>.+?) count is: [\d,]+\b/i;

  const primaryMatch = message.match(primary_regex);
  const secondaryMatch = message.match(secondary_regex);

  let fallBackType = 'completion';

  if (primaryMatch) {
    fallBackType = primaryMatch.groups.type;
  } else if (secondaryMatch) {
    fallBackType = secondaryMatch.groups.type;
  }

  return `**${playerName}** has defeated **${bossName}** with a ${fallBackType} count of **${killCount}!**`;
}

export default KillCountMsgConstructor;
