/**
 * Formats an array of strings using proper grammar:
 * - "A and B" for 2 items
 * - "A, B, and C" for 3+ items (Oxford comma)
 * @param {string[]} items - The list of string items to join.
 * @returns {string} - Grammatically correct joined string.
 */
function formatLists(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

export default formatLists;
