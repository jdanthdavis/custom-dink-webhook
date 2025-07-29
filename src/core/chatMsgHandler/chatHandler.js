import { bigFishHandler } from './bigFishHandler';
import { sepulchreHandler } from './sepulchreHandler';
import { untradeableDropHandler } from './untradeableDropHandler';
import { petGraph } from './petGraph';
import {
  CHAT_MESSAGE_TYPES,
  GEMSTONE_CRAB,
  UNTRADEABLE_ITEMS,
} from '../../constants';
import { delveHandler } from './delveHandler';
import { crabHandler } from './crabHandler';

async function chatHandler(
  msgMap,
  playerName,
  message,
  PB_URL,
  LOOT_URL,
  PET_URL,
  KC_URL,
  MONGO_MIDDLEWARE
) {
  const messageChecks = [
    // {
    //   check: (msg) =>
    //     msg.includes('(new personal best)') ||
    //     msg.includes('Delve') ||
    //     msg.includes('Deep'),
    //   type: CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST,
    // },
    {
      check: (msg) => msg.includes('gemstone crab'),
      type: GEMSTONE_CRAB,
    },
    {
      check: (msg) => UNTRADEABLE_ITEMS.some((item) => msg.includes(item)),
      type: CHAT_MESSAGE_TYPES.UNTRADEABLE_DROP,
    },
    {
      check: (msg) => msg.includes('enormous'),
      type: CHAT_MESSAGE_TYPES.BIG_FISH,
    },
    {
      check: (msg) => msg.includes('!Fetchpets'),
      type: 'FETCH_PETS',
    },
  ];

  const typeOfChat = messageChecks.find((entry) => entry.check(message))?.type;

  switch (typeOfChat) {
    case CHAT_MESSAGE_TYPES.UNTRADEABLE_DROP:
      untradeableDropHandler(message, playerName, msgMap, LOOT_URL);
      break;
    case CHAT_MESSAGE_TYPES.BIG_FISH:
      bigFishHandler(message, playerName, msgMap, LOOT_URL);
      break;
    case CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST:
      if (message.includes('Delve') || message.includes('Deep')) {
        delveHandler(message, playerName, msgMap, PB_URL, KC_URL);
      } else {
        sepulchreHandler(message, playerName, msgMap, PB_URL);
      }
      break;
    case CHAT_MESSAGE_TYPES.FETCH_PETS:
      await petGraph(message, msgMap, PET_URL, MONGO_MIDDLEWARE);
      break;
    case GEMSTONE_CRAB:
      await crabHandler(msgMap, playerName, KC_URL, MONGO_MIDDLEWARE);
      break;
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
      break;
  }
}

export default chatHandler;
