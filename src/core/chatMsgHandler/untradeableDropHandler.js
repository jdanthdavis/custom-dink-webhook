import { getThumbnailUrl, getWikiSearchUrl } from '../helperFunctions';
import * as Constants from '../../constants';

/**
 * Searches for a dropped item based on the message, matching against the items in `UNTRADEABLE_MAP`.
 * The message is normalized to lowercase for case-insensitive matching.
 *
 * @param {string} dropMessage - The drop message to search for.
 * @returns {Object|null} The matched item object, or null if no item is found.
 */
const findDroppedItem = (dropMessage) => {
  const normalizedMessage = dropMessage.toLowerCase();
  console.log('findDroppedItem: Normalized message:', normalizedMessage);

  for (const itemCategory of Object.values(Constants.UNTRADEABLE_MAP)) {
    for (const [key, item] of Object.entries(itemCategory)) {
      if (normalizedMessage.includes(item.itemName.toLowerCase())) {
        console.log('findDroppedItem: Found item:', item);
        return { ...item, key };
      }
    }
  }

  console.log('findDroppedItem: No match found for message:', dropMessage);
  return null;
};

/**
 * Handles untradeable drop messages by finding the item and generating an embed for it.
 * The embed includes the player's name, item name, value, and a link to the boss and item wiki pages.
 *
 * @param {string} message - The drop message received.
 * @param {string} playerName - The name of the player who received the drop.
 * @param {Array} embeds - An array of embed objects to be modified and returned.
 * @returns {Array|null} An array of modified embed objects, or null if no match is found.
 */
export function untradeableDropHandler(message, playerName, embeds) {
  console.log('Processing message:', message);

  const match = Object.values(Constants.CHAT_REGEX)
    .map((regex) => message?.match(regex))
    .find((result) => result !== null);

  if (!match) {
    console.log('untradeableDropHandler: No regex match found.');
    return;
  }

  const droppedItem = findDroppedItem(message);
  if (!droppedItem) {
    console.log(
      'untradeableDropHandler: No matching item found in UNTRADEABLE_MAP.'
    );
    return;
  }

  const { itemName, boss, value, thumbnail } = droppedItem;

  if (!embeds.length) {
    console.log('untradeableDropHandler: Embeds array is empty.');
    return;
  }

  const untradeableDropEmbed = embeds.map((embed) => ({
    ...embed,
    title: 'Loot Drop',
    description: `${playerName} has looted:\n\n 1 x [${itemName}](${getWikiSearchUrl(
      itemName
    )}) (${value})\nFrom: [${boss}](${getWikiSearchUrl(boss)})`,
    fields: [
      {
        name: 'Total Value',
        value: `\`\`\`${value}\`\`\``,
        inline: true,
      },
    ],
    thumbnail: { url: getThumbnailUrl(thumbnail) },
  }));

  return untradeableDropEmbed;
}
