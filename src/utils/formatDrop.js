import formatPrice from './formatPrice/formatPrice';

/**
 * Formats a drops
 * @param {*}
 * @returns
 */
function formatClue(msgMap, playerName, extra, URL) {
  const { items, source } = extra;
  const multipleItems = items?.length >= 2;

  const message = `**${playerName}** has received ${items
    .map((item) => {
      multipleItems
        ? `multiple items dropped`
        : `x${item.quantity} ${item.name} (${formatPrice(
            item.priceEach
          )}) from ${source}`;
    })
    .join('\n')}`;

  msgMap.set({ ID: 'DROP', URL }, message);

  return msgMap;
}

export default formatClue;
