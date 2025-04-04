import * as Constants from './constants';
import { BigFishHandler } from './BigFishHandler';
import { SepulchreHandler } from './SepulchreHandler';
import { VestigeHandler } from './VestigeHandler';

/**
 * Handles various chat messages.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information. See {@link https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#chat} for all the information.
 * @param {*} typeOfChat - The chat type. See {@link https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#chat} for the list of possible chat types.
 * @param {*} URL - The associated URL
 */
function ChatHandler(msgMap, playerName, extra, typeOfChat, URL) {
  const message = extra?.message;
  const chatType = Constants.CHAT_MESSAGE_TYPES;

  switch (typeOfChat) {
    case chatType.BIG_FISH:
      BigFishHandler(msgMap, playerName, message, URL);
      break;
    case chatType.VESTIGE_DROP:
      VestigeHandler(msgMap, playerName, msgmessageMap, URL);
      break;
    case chatType.NEW_PERSONAL_BEST:
      SepulchreHandler(msgMap, playerName, message, URL);
      break;
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
      break;
  }
}

export default ChatHandler;
