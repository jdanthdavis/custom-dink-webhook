import { getWikiSearchUrl } from './helperFunctions';
import * as Constants from '../constants';

/**
 * Checks if the current kill count is valid for a notification based on certain conditions.
 * If the kill count is divisible by a specified interval or is a special kill, it allows the notification.
 *
 * @param {Object} extra - Additional information related to the kill count.
 * @param {string} extra.boss - The name of the boss being defeated.
 * @param {number} extra.count - The current kill count for the boss.
 * @param {Array} embeds - The list of embed objects to be updated based on the kill count.
 * @param {string} playerName - The name of the player triggering the kill count notification.
 * @returns {Object|boolean}
 *   - If the kill count is valid, returns an object containing:
 *     - `isKillCountValid` {boolean} - Whether the kill count is valid for notification.
 *     - `killCountEmbed` {Array} - The updated embed with the kill count information.
 *   - If the kill count is invalid, returns `false`.
 */
function killCountHandler(extra, embeds, playerName) {
  const { boss, count: killCount } = extra || {};
  const bossInterval = Constants.bossMap.get(boss?.toUpperCase());

  const isKillCountValid =
    killCount % bossInterval === 0 ||
    killCount % 100 === 0 ||
    (killCount === 1 && Constants.specialKills.includes(boss.toUpperCase()));

  if (!isKillCountValid) return false;

  const killCountEmbed = embeds.map((embed) => ({
    ...embed,
    title: 'Kill Count',
    description: `${playerName} has defeated [${boss}](${getWikiSearchUrl(
      boss
    )}) with a completion count of ${killCount}`,
  }));

  return { isKillCountValid, killCountEmbed };
}

export default killCountHandler;
