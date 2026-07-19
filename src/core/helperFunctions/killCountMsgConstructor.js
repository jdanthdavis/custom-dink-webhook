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

  /** @type {Record<string, { displayName: string, type: string }>} */
  const SPECIAL_CASES = {
    [Constants.THE_GRUMBLER]: { displayName: Constants.THE_GRUMBLER, type: 'grumble' },
    [Constants.LUNAR_CHEST]: { displayName: Constants.MOONS_OF_PERIL, type: 'chest' },
  };

  const specialKcMsg = SPECIAL_CASES[bossName];
  if (specialKcMsg) {
    return `**${playerName}** has defeated **${specialKcMsg.displayName}** with a ${specialKcMsg.type} count of **${killCount.toLocaleString()}!**`;
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
