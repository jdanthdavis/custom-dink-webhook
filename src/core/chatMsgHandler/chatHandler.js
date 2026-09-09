import { bigFishHandler } from './bigFishHandler';
import { sepulchreHandler } from './sepulchreHandler';
import { untradeableDropHandler } from './untradeableDropHandler';
import {
  CHAT_MESSAGE_TYPES,
  DELVE_KC,
  GEMSTONE_CRAB,
  UNTRADEABLE_ITEMS,
} from '../../constants';
import { delveHandler } from './delveHandler';
import { crabHandler } from './crabHandler';

/**
 * Delegates a chat message to the appropriate sub-handler based on its content.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {string} message - The raw chat message text
 * @param {string} PB_URL - The personal-best notification URL
 * @param {string} LOOT_URL - The loot notification URL
 * @param {string} KC_URL - The kill-count notification URL
 * @param {*} CRAB_DB - D1 database binding for Gemstone Crab kill count tracking
 */
async function chatHandler(
  msgMap,
  playerName,
  message,
  PB_URL,
  LOOT_URL,
  KC_URL,
  CRAB_DB
) {
  const messageChecks = [
    {
      check: () => message.includes('(new personal best)'),
      type: CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST,
    },
    {
      check: () => message.includes('Deep delves'),
      type: DELVE_KC,
    },
    {
      check: () => message.includes('gemstone crab'),
      type: GEMSTONE_CRAB,
    },
    {
      check: () => UNTRADEABLE_ITEMS.some((item) => message.includes(item)),
      type: CHAT_MESSAGE_TYPES.UNTRADEABLE_DROP,
    },
    {
      check: () => message.includes('enormous'),
      type: CHAT_MESSAGE_TYPES.BIG_FISH,
    },
  ];

  const typeOfChat = messageChecks.find((entry) => entry.check())?.type;

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
    case GEMSTONE_CRAB:
      await crabHandler(msgMap, playerName, KC_URL, CRAB_DB);
      break;
    case DELVE_KC:
      delveHandler(message, playerName, msgMap, KC_URL);
      break;
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
      break;
  }
}

export default chatHandler;
