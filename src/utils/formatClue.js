/**
 * Formats a clue scroll's rewards
 * @param {*}
 * @returns
 */
function formatClue(msgMap, playerName, extra, URL) {
  const { clueType, numberCompleted, items } = extra;

  function formatPrice(value) {
    if (value >= 2_147_000_000) return '**Very valuable**';
    if (value >= 1_000_000_000)
      return `**${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B**`;
    if (value >= 1_000_000)
      return `**${(value / 1_000_000).toFixed(2).replace(/\.00$/, '')}M**`;
    if (value >= 1_000)
      return `**${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K**`;
    return `**${value}**`;
  }

  const message = `**${playerName}** has completed a **${clueType} clue!** | **Total: ${numberCompleted}**\nRewards:\n${items
    .map(
      (item) =>
        `- ${item.name} - x${item.quantity} - (${formatPrice(item.priceEach)})`
    )
    .join('\n')}`;

  msgMap.set({ ID: 'CLUE', URL }, message);

  return msgMap;
}

export default formatClue;
