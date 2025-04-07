import * as Constants from '../../constants';

/**
 * Processes a vestige drop message and updates the embed data accordingly.
 *
 * This function extracts vestige-related details from the message, such as the vestige type,
 * boss name, and item links. It then formats and returns an updated embed containing the loot drop information.
 *
 * @param {string} message - The chat message containing vestige drop information.
 * @param {string} playerName - The name of the player who received the vestige drop.
 * @param {Array<Object>} embeds - The list of embed objects to be updated.
 * @returns {Array<Object>|undefined} An array of updated embed objects with the vestige drop details, or `undefined` if the message does not match the expected pattern.
 */
export function vestigeHandler(message, playerName, embeds) {
  const match = message?.match(Constants.CHAT_REGEX.VESTIGE_TEXT);

  if (!match) return;

  const vestigeType = match[1];
  const currentVestige = Constants.VESTIGE_MAP[vestigeType];
  const bossName = currentVestige.boss;
  const bossLink = currentVestige.bossLink;
  const itemLink = currentVestige.itemLink;
  const vestigeThumbnail = currentVestige.thumbnail;

  const vestigeEmbed = embeds.map((embed) => ({
    ...embed,
    title: 'Loot Drop',
    description: `${playerName} has looted:\n\n 1 x [${vestigeType} vestige](${itemLink}) (5M)\nFrom: [${bossName}](${bossLink})`,
    fields: [
      {
        name: 'Total Value',
        value: '```5M```',
        inline: true,
      },
    ],
    thumbnail: { url: vestigeThumbnail },
  }));

  return vestigeEmbed;
}
