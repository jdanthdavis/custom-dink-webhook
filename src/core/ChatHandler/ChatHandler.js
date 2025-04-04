import * as Constants from '../../constants';
import { bigFishHandler } from './bigFishHandler';
import { sepulchreHandler } from './sepulchreHandler';
import { vestigeHandler } from './vestigeHandler';
//
function chatHandler(msgMap, playerName, extra, typeOfChat, URL) {
  const message = extra?.message;
  const chatType = Constants.CHAT_MESSAGE_TYPES;

  switch (typeOfChat) {
    case chatType.BIG_FISH:
      bigFishHandler(message, playerName, msgMap, URL);
      break;
    case chatType.VESTIGE_DROP:
      vestigeHandler(message, playerName, msgMap, URL);
      break;
    case chatType.NEW_PERSONAL_BEST:
      sepulchreHandler(message, playerName, msgMap, URL);
      break;
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
      break;
  }
}

export default chatHandler;
