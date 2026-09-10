/**
 * Joins items with proper grammar: "A and B", or "A, B, and C" (Oxford comma).
 * @param {string[]} items
 * @returns {string}
 */
function formatLists(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

export default formatLists;
