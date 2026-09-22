import { bigFishHandler } from './bigFishHandler';
import { sepulchreHandler } from './sepulchreHandler';
import { untradeableDropHandler } from './untradeableDropHandler';
import {
  CHAT_MESSAGE_TYPES,
  CHAT_REGEX,
  DELVE_KC,
  GEMSTONE_CRAB,
  UNTRADEABLE_ITEMS,
  theBoys,
} from '../../constants';
import { delveHandler } from './delveHandler';
import { crabHandler } from './crabHandler';
import { barracudaTrialHandler } from './barracudaTrialHandler';
import { getChatBroadcastAchiever } from '../helperFunctions';

/**
 * Delegates a chat message to the appropriate sub-handler based on its content.
 * Chat lines that broadcast a third party's name (clan/public chat) are
 * dropped up front if that name isn't a tracked player - any tracked
 * player's client can relay a broadcast about someone else. Message types
 * that never embed a name (private game messages) pass through unaffected.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} playerName
 * @param {string} message
 * @param {string} PB_URL
 * @param {string} LOOT_URL
 * @param {string} KC_URL
 * @param {*} CRAB_DB
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
  const achiever = getChatBroadcastAchiever(message);
  if (achiever && !theBoys.includes(achiever.toUpperCase())) {
    console.log(`chatHandler: ignoring broadcast not from theBoys: ${message}`);
    return;
  }

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
    {
      check: () => CHAT_REGEX.BARRACUDA_TRIAL_TIME_TEXT.test(message),
      type: CHAT_MESSAGE_TYPES.BARRACUDA_TRIAL_PB,
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
    case CHAT_MESSAGE_TYPES.BARRACUDA_TRIAL_PB:
      barracudaTrialHandler(message, playerName, msgMap, PB_URL);
      break;
    default:
      console.log(`Unknown type of chat: ${typeOfChat}`);
      break;
  }
}

export default chatHandler;
