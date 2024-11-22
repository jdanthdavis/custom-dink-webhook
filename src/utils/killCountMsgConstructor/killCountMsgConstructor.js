/**
 *
 * @param {*} playerName
 * @param {*} gameMessage
 * @param {*} bossName
 * @returns
 */
function killCountMsgConstructor(playerName, gameMessage, bossName) {
  const primary_regex =
    /Your (?<key>.+)\s(?<type>kill|chest|completion|harvest)\s?count is: (?<value>[\d,]+)\b/i;
  const secondary_regex =
    /Your (?<type>completed|subdued) (?<key>.+?) count is: (?<value>[\d,]+)\b/i;
  const primaryMatch = gameMessage.match(primary_regex);
  const secondaryMatch = gameMessage.match(secondary_regex);
  const formattedKC = gameMessage?.split(': ')[1]?.replace('.', '!');
  let key = '';

  if (primaryMatch) {
    switch (primaryMatch.groups.type) {
      case 'kill':
        key = 'kill';
        break;
      case 'harvest':
        key = 'harvest';
        break;
      case 'chest':
        key = 'chest';
        break;
      default:
        key = 'completion';
    }
  } else if (secondaryMatch) {
    switch (secondaryMatch.groups.type) {
      case 'completed':
        key = 'completed';
        break;
      case 'subdued':
        key = 'subdued';
        break;
      default:
        key = 'completion';
    }
  }

  return `**${playerName}** has defeated **${bossName}** with a ${key} count of **${formattedKC}**`;
}

export default killCountMsgConstructor;
