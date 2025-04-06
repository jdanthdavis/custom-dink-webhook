import {
  collectionLogHandler,
  petHandler,
  combatTaskHandler,
  killCountHandler,
  personalBestHandler,
  clueScrollHandler,
  lootHandler,
  ruleHandler,
} from './core';
import chatHandler from './core/chatMsgHandler/chatHandler';
import * as Constants from './constants';

/**
 * Creates the formData payload to send to a URL based on the provided payload type.
 *
 * This function handles different types of payloads, formats the relevant data,
 * and returns a message map to be sent to the appropriate URL.
 *
 * The following payload types are supported:
 * - Pet
 * - Collection Log
 * - Combat Achievement
 * - Kill Count
 * - Clue Scroll
 * - Loot
 * - Chat
 *
 * For more information on the payload types, see [here](https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#all).
 *
 * @param {*} extra - Additional information required for formatting the message.
 * @param {*} payloadType - The type of payload (e.g., Pet, Collection, Level, etc.).
 *                          For more details, see the link provided in the description.
 * @param {string} playerName - The name of the player.
 * @param {*} env - The URLs used for each payload type.
 * @returns {Map<{ ID: string, URL: string }, string>} - The updated message map containing the formatted message.
 */
function createFormData(extra, payloadType, playerName, env) {
  const {
    KC_URL,
    PB_URL,
    COLLECTION_URL,
    PET_URL,
    CA_URL,
    CLUE_URL,
    LOOT_URL,
  } = env;

  let msgMap = new Map();

  switch (payloadType) {
    case Constants.PET:
      if (ruleHandler(payloadType, extra)) return;
      petHandler(msgMap, playerName, extra, PET_URL);
      break;
    case Constants.COLLECTION:
      collectionLogHandler(msgMap, playerName, extra, COLLECTION_URL);
      break;
    case Constants.COMBAT_ACHIEVEMENT:
      combatTaskHandler(msgMap, playerName, extra, CA_URL);
      break;
    case Constants.KILL_COUNT:
      killCountHandler(msgMap, playerName, extra, KC_URL);
      break;
    case Constants.CLUE:
      if (ruleHandler(payloadType, extra)) return;
      clueScrollHandler(msgMap, playerName, extra, CLUE_URL);
      break;
    case Constants.LOOT:
      if (ruleHandler(payloadType, extra)) return;
      lootHandler(msgMap, playerName, extra, LOOT_URL);
      break;
    case Constants.CHAT:
      let typeOfChat;
      const isPersonalBest = extra.message.includes('(new personal best)');
      if (isPersonalBest) {
        typeOfChat = Constants.CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST;
      } else if (extra.message.includes('vestige')) {
        typeOfChat = Constants.CHAT_MESSAGE_TYPES.VESTIGE_DROP;
      }
      const URL = isPersonalBest ? PB_URL : LOOT_URL;

      chatHandler(msgMap, playerName, extra, typeOfChat, URL);

      break;
    default:
      console.log(`Unknown payload type: ${payloadType}`);
  }

  if (extra?.isPersonalBest) {
    personalBestHandler(msgMap, playerName, extra, PB_URL);
  }

  return msgMap;
}

export default createFormData;
