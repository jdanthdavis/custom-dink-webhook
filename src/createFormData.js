import {
  collectionLogHandler,
  petHandler,
  combatTaskHandler,
  killCountHandler,
  levelUpHandler,
  personalBestHandler,
  clueScrollHandler,
  lootHandler,
  deathHandler,
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
 * - Level Up
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
async function createFormData(extra, content, payloadType, playerName, env) {
  const {
    KC_URL,
    PB_URL,
    COLLECTION_URL,
    PET_URL,
    LEVEL_URL,
    CA_URL,
    CLUE_URL,
    LOOT_URL,
    DEATH_URL,
    MONGO_MIDDLEWARE,
  } = env;

  let msgMap = new Map();

  switch (payloadType) {
    case Constants.PET:
      await petHandler(msgMap, playerName, extra, MONGO_MIDDLEWARE, PET_URL);
      break;
    case Constants.COLLECTION:
      collectionLogHandler(msgMap, playerName, extra, COLLECTION_URL);
      break;
    case Constants.LEVEL:
    case Constants.XP_MILESTONE:
      levelUpHandler(msgMap, playerName, extra, LEVEL_URL);
      break;
    case Constants.COMBAT_ACHIEVEMENT:
      combatTaskHandler(msgMap, playerName, extra, CA_URL);
      break;
    case Constants.KILL_COUNT:
      killCountHandler(msgMap, playerName, extra, KC_URL);
      break;
    case Constants.CLUE:
      clueScrollHandler(msgMap, playerName, extra, CLUE_URL);
      break;
    case Constants.LOOT:
      lootHandler(msgMap, extra.items, playerName, extra.source, LOOT_URL);
      break;
    case Constants.DEATH:
      deathHandler(msgMap, playerName, extra, DEATH_URL);
      break;
    case Constants.CHAT:
      chatHandler(
        msgMap,
        playerName,
        extra.message,
        PB_URL,
        LOOT_URL,
        MONGO_MIDDLEWARE
      );
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
