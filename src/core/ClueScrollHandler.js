import { FormatPrice } from './formatters';

/**
 * Formats a clue scroll's rewards
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns
 */
function ClueScrollHandler(msgMap, playerName, extra, URL) {
  const { clueType, numberCompleted, items } = extra;
  const message = `**${playerName}** has completed a **${clueType} clue!** | **Total: ${numberCompleted}**
Rewards:
${items
  .map(
    (item) =>
      `- ${item.name} - x${item.quantity} - **${FormatPrice(item.priceEach)}**`
  )
  .join('\n')}`;
  msgMap.set({ ID: 'CLUE', URL }, message);
  return msgMap;
}

export default ClueScrollHandler;
