import { bigFishHandler } from './bigFishHandler';
import { sepulchreHandler } from './sepulchreHandler';
import { vestigeHandler } from './vestigeHandler';
import { tobKitHandler } from './tobKitHandler';
import { CHAT_MESSAGE_TYPES } from '../../constants';

function chatHandler(msgMap, playerName, message, PB_URL, LOOT_URL) {
  const messageChecks = [
    {
      check: (msg) => msg.includes('(new personal best)'),
      type: CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST,
    },
    {
      check: (msg) => msg.includes('vestige'),
      type: CHAT_MESSAGE_TYPES.VESTIGE_DROP,
    },
    {
      check: (msg) => ['kit', 'dust'].some((sub) => msg.includes(sub)),
      type: CHAT_MESSAGE_TYPES.TOB_KIT,
    },
    {
      check: (msg) => msg.includes('enormous'),
      type: CHAT_MESSAGE_TYPES.BIG_FISH,
    },
  ];
  const typeOfChat = messageChecks.find((entry) => entry.check(message))?.type;

  switch (typeOfChat) {
    case CHAT_MESSAGE_TYPES.BIG_FISH:
      bigFishHandler(message, playerName, msgMap, LOOT_URL);
      break;
    case CHAT_MESSAGE_TYPES.VESTIGE_DROP:
      vestigeHandler(message, playerName, msgMap, LOOT_URL);
      break;
    case CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST:
      sepulchreHandler(message, playerName, msgMap, PB_URL);
      break;
    case CHAT_MESSAGE_TYPES.TOB_KIT:
      tobKitHandler(message, playerName, msgMap, LOOT_URL);
      break;
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
      break;
  }
}

export default chatHandler;
