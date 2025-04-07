import * as Constants from '../../constants';
import { sepulchreHandler } from './sepulchreHandler';
import { vestigeHandler } from './vestigeHandler';

/**
 * Handles different types of chat messages and processes them accordingly.
 *
 * This function routes the message to the appropriate handler based on the type
 * of chat message (`VESTIGE_DROP` or `NEW_PERSONAL_BEST`). The handlers process
 * the message and modify the provided `embeds` accordingly. If an unknown type
 * of chat is provided, an error is thrown.
 *
 * Supported Chat Types:
 * - VESTIGE_DROP: Processes vestige drop messages using the `vestigeHandler`.
 * - NEW_PERSONAL_BEST: Processes new personal best messages using the `sepulchreHandler`.
 *
 * @param {Array} embeds - The list of embed objects to be updated based on the chat message.
 * @param {string} playerName - The name of the player who triggered the chat message.
 * @param {Object} extra - Additional data related to the chat, including the message and count.
 * @param {string} typeOfChat - The type of chat message being handled (e.g., `VESTIGE_DROP`, `NEW_PERSONAL_BEST`).
 * @param {string} URL - The URL to which the message will be sent.
 *
 */
function chatHandler(embeds, playerName, extra, URL) {
  const message = extra?.message;
  const chatType = Constants.CHAT_MESSAGE_TYPES;
  const typeOfChat = message.includes('(new personal best)')
    ? chatType.NEW_PERSONAL_BEST
    : chatType.VESTIGE_DROP;

  switch (typeOfChat) {
    case chatType.VESTIGE_DROP:
      vestigeHandler(message, extra.count, playerName, embeds, URL);
      break;
    case chatType.NEW_PERSONAL_BEST:
      sepulchreHandler(message, playerName, embeds, URL);
      break;
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
  }
}

export default chatHandler;
