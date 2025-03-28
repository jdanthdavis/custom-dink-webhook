import { FormatPrice } from './formatters';
import { GrumblerCheck } from './helperFunctions';

/**
 * Formats drops
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns
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
