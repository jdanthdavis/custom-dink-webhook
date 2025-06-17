import { formatValue } from './helperFunctions';
import { CLUE } from '../constants';

/**
 * Formats a clue scroll's rewards
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {Object<string, any>} extra - Additional information
 * @param {string} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function clueScrollHandler(msgMap, playerName, extra, URL) {
  const { clueType, numberCompleted, items } = extra;
  const totalValue = items.reduce((acc, item) => acc + item.quantity * item.priceEach, 0);
  const message = `**${playerName}** has completed **${numberCompleted} ${clueType}** clue${numberCompleted > 1 && `s`}! | Total Value: **${formatValue(totalValue)}**
Rewards:
${items
  .map(
    (item) =>
      `- ${item.quantity}x ${item.name} **${formatValue(
        item.priceEach * item.quantity
      )}**`
  )
  .join('\n')}`;

  msgMap.set({ ID: CLUE, URL }, message);

  return msgMap;
}

export default clueScrollHandler;
