import { getThumbnailUrl, getWikiSearchUrl } from '../helperFunctions';
import * as Constants from '../../constants';

/**
 * Processes a personal best message for the Hallowed Sepulchre and updates the embed data.
 *
 * This function extracts the overall or floor-specific personal best time from the message
 * and formats an embed to display the achievement.
 *
 * @param {string} message - The chat message containing the personal best information.
 * @param {string} playerName - The name of the player who achieved the personal best.
 * @param {Array<Object>} embeds - The list of embed objects to be updated.
 * @returns {Array<Object>} An array of updated embed objects with the personal best details. Returns an empty array if no matching time is found.
 */
export function sepulchreHandler(message, playerName, embeds) {
  const overallMatch = message.match(Constants.CHAT_REGEX.OVERALL_TIME_TEXT);
  const floorMatch = message.match(Constants.CHAT_REGEX.FLOOR_TIME_TEXT);

  if (!overallMatch && !floorMatch) return []; // Return an empty array instead of undefined

  const updatedEmbeds = embeds.map((embed) => ({
    ...embed,
    title: 'Personal Best',
    thumbnail: { url: getThumbnailUrl('24711') },
    description: overallMatch
      ? `${playerName} has achieved a new [Hallowed Sepulchre](${getWikiSearchUrl(
          'Hallowed Sepulchre'
        )}) (Overall) personal best of ${overallMatch[1]}`
      : `${playerName} has achieved a new [Hallowed Sepulchre](${getWikiSearchUrl(
          'Hallowed Sepulchre'
        )}) (Floor ${floorMatch[1]}) personal best of ${floorMatch[2]}`,
  }));

  return updatedEmbeds;
}
