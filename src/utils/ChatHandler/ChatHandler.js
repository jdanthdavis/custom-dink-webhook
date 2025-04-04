import * as Constants from './constants';
import { BigFishHandler } from './BigFishHandler';
import { SepulchreHandler } from './SepulchreHandler';
import { VestigeHandler } from './VestigeHandler';

function ChatHandler(msgMap, playerName, extra, typeOfChat, URL) {
  const message = extra?.message;
  const chatType = Constants.CHAT_MESSAGE_TYPES;

  switch (typeOfChat) {
    case chatType.BIG_FISH:
      BigFishHandler(message, playerName, msgMap, URL);
      break;
    case chatType.VESTIGE_DROP:
      VestigeHandler(message, playerName, msgMap, URL);
      break;
    case chatType.NEW_PERSONAL_BEST:
      SepulchreHandler(message, playerName, msgMap, URL);
      break;
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
      break;
  }
}

export default ChatHandler;
