import * as Constants from '../../constants';

/**
 * Adds the correct wording for specific kill count messages
 * @param {*} playerName
 * @param {*} gameMessage
 * @param {*} bossName
 * @param {number} killCount
 * @returns
 */
function killCountMsgConstructor(playerName, gameMessage, bossName, killCount) {
  const primary_regex =
    /Your (?<key>.+)\s(?<type>kill|chest|completion|success|harvest)\s?count is: [\d,]+\b/i;
  const secondary_regex =
    /Your (?<type>completed|subdued) (?<key>.+?) count is: [\d,]+\b/i;

  /** @type {Record<string, string>} */
  const TYPE_MAP = {
    [Constants.THE_GRUMBLER]: 'grumble',
    [Constants.MOONS_OF_PERIL]: 'chest',
  };

  const specialType = TYPE_MAP[bossName];
  if (specialType) {
    return `**${playerName}** has defeated **${bossName}** with a ${specialType} count of **${killCount.toLocaleString()}!**`;
  }

  const primaryMatch = gameMessage.match(primary_regex);
  const secondaryMatch = primaryMatch ? null : gameMessage.match(secondary_regex);

  let fallBackType = 'completion';

  if (primaryMatch) {
    fallBackType = primaryMatch.groups.type;
  } else if (secondaryMatch) {
    fallBackType = secondaryMatch.groups.type;
  }

  return `**${playerName}** has defeated **${bossName}** with a ${fallBackType.toLowerCase()} count of **${killCount.toLocaleString()}!**`;
}

export default killCountMsgConstructor;
