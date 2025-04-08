import { getWikiSearchUrl } from './helperFunctions';

/**
 * Formats and generates an embed for a player's personal best in a specific boss fight.
 * The function cleans the time string from ISO-8601 format, ensuring it is readable and includes a link to the boss's page.
 *
 * @param {Object} extra - An object containing additional information related to the personal best.
 * @param {string} [extra.boss] - The name of the boss being defeated. This property is optional.
 * @param {string} [extra.time] - The player's personal best time in ISO-8601 format (e.g., PT1M30S). This property is optional.
 * @param {Array} embeds - An array of embed objects to be updated based on the personal best.
 * @param {string} playerName - The name of the player triggering the personal best notification.
 * @returns {Array} An array of updated embed objects with the player's new personal best, including a formatted time.
 */
function personalBestHandler(extra, embeds, playerName) {
  const { boss, time } = extra || {};

  /**
   * Cleans and formats an ISO-8601 duration time string into a human-readable format.
   *
   * @param {string} time - The ISO-8601 duration string (e.g., PT1M30S, PT30S).
   * @returns {string} A cleaned and formatted time string (e.g., 1:30, 00:30s, 1:30.5).
   */
  function cleanTime(time) {
    // Remove the leading PT
    let cleanedTime = time.replace('PT', '');

    // Case 1: Only seconds (add 's' at the end)
    if (!cleanedTime.includes('M') && cleanedTime.includes('S')) {
      cleanedTime = `${cleanedTime.replace('S', '')}s`;
    }
    // Case 2: Only minutes (add ':00' for seconds)
    else if (cleanedTime.includes('M') && !cleanedTime.includes('S')) {
      cleanedTime = cleanedTime.replace('M', ':00');
    }
    // Case 3: Minutes and seconds (or minutes, seconds, and milliseconds)
    else {
      cleanedTime = cleanedTime.replace('M', ':').replace('S', '');

      // If milliseconds exist, ensure two digits for seconds
      if (
        cleanedTime.split(':')[1].length === 1 ||
        cleanedTime.split(':').pop().split('.')[0].length === 1
      ) {
        cleanedTime = cleanedTime.replace(':', ':0');
      }
    }
    return cleanedTime;
  }

  const personalBestEmbed = embeds.map((embed) => ({
    ...embed,
    title: 'Personal Best',
    description: `${playerName} has defeated [${boss}](${getWikiSearchUrl(
      boss
    )}) with a new personal best of ${cleanTime(time)}`,
  }));

  return personalBestEmbed;
}

export default personalBestHandler;
