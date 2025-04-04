import { FormatPrice } from './formatters';
import { GrumblerCheck } from './helperFunctions';

/**
 * Formats drops
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function LootHandler(msgMap, playerName, extra, URL) {
  const { items, source } = extra;
  const message = `**${playerName}** has received **${items
    .map(
      (item) => `x${item.quantity} ${item.name} ${FormatPrice(item.priceEach)}`
    )
    .join(items.length > 1 ? ' and ' : '')}** from **${GrumblerCheck(
    source
  )}!**`;
  msgMap.set({ ID: 'LOOT', URL }, message);

  return msgMap;
}

export default LootHandler;
