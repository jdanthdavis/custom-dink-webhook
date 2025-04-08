import * as Constants from '../../constants';
import { sepulchreHandler } from './sepulchreHandler';
import { untradeableDropHandler } from './untradeableDropHandler';

/**
 * Handles different types of chat messages and processes them accordingly.
 *
 * This function determines the type of chat message and routes it to the appropriate handler.
 * It modifies the provided `embeds` array accordingly and returns the updated embed data.
 *
 * Supported Chat Types:
 * - `VESTIGE_DROP`: Processes vestige drop messages using the `vestigeHandler`.
 * - `NEW_PERSONAL_BEST`: Processes new personal best messages using the `sepulchreHandler`.
 *
 * @param {Array<Object>} embeds - The list of embed objects to be updated based on the chat message.
 * @param {string} playerName - The name of the player who triggered the chat message.
 * @param {string} message - The chat message to process.
 * @param {string} LOOT_URL - The URL associated with loot drops.
 * @param {string} PB_URL - The URL associated with personal best records.
 * @returns {{ chatURL: string, chatEmbed: Array<Object> }} An object containing the chat URL and modified embed data.
 */
function chatHandler(embeds, playerName, message, LOOT_URL, PB_URL) {
  const chatType = Constants.CHAT_MESSAGE_TYPES;
  const typeOfChat = message.includes('(new personal best)')
    ? chatType.NEW_PERSONAL_BEST
    : chatType.UNTRADEABLE_DROP;
  const chatURL = handleChatURL(message, PB_URL, LOOT_URL);
  let chatEmbed;

  /**
   * Determines the appropriate URL based on the chat message.
   *
   * @param {string} message - The chat message to evaluate.
   * @param {string} PB_URL - The URL for personal best achievements.
   * @param {string} LOOT_URL - The URL for loot drops.
   * @returns {string} The selected URL based on the message type.
   */
  function handleChatURL(message, PB_URL, LOOT_URL) {
    const isPersonalBest = message.includes('(new personal best)');
    return isPersonalBest ? PB_URL : LOOT_URL;
  }

  switch (typeOfChat) {
    case chatType.UNTRADEABLE_DROP:
      chatEmbed = untradeableDropHandler(message, playerName, embeds);
      break;
    case chatType.NEW_PERSONAL_BEST:
      chatEmbed = sepulchreHandler(message, playerName, embeds);
      break;
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
  }

  return { chatURL, chatEmbed };
}

export default chatHandler;
