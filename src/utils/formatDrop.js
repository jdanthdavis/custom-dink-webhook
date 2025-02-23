import formatPrice from './formatPrice/formatPrice';

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

  const message = `**${playerName}** has received ${items
    .map(
      (item) =>
        `x${item.quantity} ${item.name} (${formatPrice(item.priceEach)})`
    )
    .join(items.length > 1 ? ' and ' : '')} from ${source}!`;

  msgMap.set({ ID: 'DROP', URL }, message);

  return msgMap;
}

export default formatDrop;
