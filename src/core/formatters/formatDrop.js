import formatPrice from './formatPrice';
import { grumblerCheck } from '../helperFunctions';

/**
 * Formats drops
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns
 */
function formatDrop(msgMap, playerName, extra, URL) {
  const { items, source } = extra;
  const message = `**${playerName}** has received **${items
    .map(
      (item) => `x${item.quantity} ${item.name} ${formatPrice(item.priceEach)}`
    )
    .join(items.length > 1 ? ' and ' : '')}** from **${grumblerCheck(
    source
  )}!**`;
  msgMap.set({ ID: 'LOOT', URL }, message);
  return msgMap;
}

export default formatDrop;
