import { bigFishHandler } from './bigFishHandler';
import { sepulchreHandler } from './sepulchreHandler';
import { untradeableDropHandler } from './untradeableDropHandler';
import { petGraph } from './petGraph';
import { CHAT_MESSAGE_TYPES, UNTRADEABLE_ITEMS } from '../../constants';

function chatHandler(
  msgMap,
  playerName,
  message,
  PB_URL,
  LOOT_URL,
  MONGO_MIDDLEWARE
) {
  const messageChecks = [
    {
      check: (msg) => msg.includes('(new personal best)'),
      type: CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST,
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
      check: (msg) => msg.includes('Dossier'),
      type: 'YAMA_CONTRACT',
    },
    {
      check: (msg) => msg.includes('Purifying sigil'),
      type: 'YAMA_SIGIL',
    },
    {
      check: (msg) => msg.includes('!fetchpets'),
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
      sepulchreHandler(message, playerName, msgMap, PB_URL);
      break;
    case CHAT_MESSAGE_TYPES.FETCH_PETS:
      petGraph(message, playerName, msgMap, MONGO_MIDDLEWARE);
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
      break;
  }
}

export default chatHandler;
