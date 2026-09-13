import { formatValue } from './helperFunctions';
import { CLUE } from '../constants';

/**
 * Formats a completed clue scroll's rewards.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} playerName
 * @param {*} extra
 * @param {string} URL
 * @returns {Map<{ ID: string, URL: string }, string>}
 */
function clueScrollHandler(msgMap, playerName, extra, URL) {
  const { clueType, numberCompleted } = extra || {};
  /** @type {Array<{ name: string, quantity: number, priceEach: number }>} */
  const items = extra?.items ?? [];
  const totalValue = items.reduce(
    (acc, item) => acc + item.quantity * item.priceEach,
    0
  );
  const completedCount = numberCompleted ?? 0;
  const message = `**${playerName}** has completed **${completedCount.toLocaleString()} ${clueType}** clue${
    completedCount > 1 ? `s` : ``
  }! | Total Value: **${formatValue(totalValue, true)}**
**Rewards:**
${items
  .map(
    (item) =>
      `- ${item.quantity.toLocaleString()}x ${item.name} **${formatValue(
        item.priceEach * item.quantity
      )}**`
  )
  .join('\n')}`;

  msgMap.set({ ID: CLUE, URL }, message);

  return msgMap;
}

export default clueScrollHandler;
