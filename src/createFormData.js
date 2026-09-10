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
  tcgHandler,
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
 * @param {*} content - The raw content string, used by payload types like EXTERNAL_PLUGIN.
 * @param {*} payloadType - The type of payload (e.g., Pet, Collection, Level, etc.).
 *                          For more details, see the link provided in the description.
 * @param {string} playerName - The name of the player.
 * @param {*} env - The URLs and binding used for each payload type.
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>} - The updated message map containing the formatted message.
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
    EXTERNAL_URL,
    PETS_DB,
    CRAB_DB,
    WEEKLY_RECAP_DB,
    CA_PROGRESS,
  } = env;

  let msgMap = new Map();

  switch (payloadType) {
    case Constants.PET:
      await petHandler(msgMap, playerName, extra, PETS_DB, PET_URL);
      break;
    case Constants.COLLECTION:
      await collectionLogHandler(
        msgMap,
        playerName,
        extra,
        WEEKLY_RECAP_DB,
        COLLECTION_URL
      );
      break;
    case Constants.LEVEL:
    case Constants.XP_MILESTONE:
      levelUpHandler(msgMap, playerName, extra, LEVEL_URL);
      break;
    case Constants.COMBAT_ACHIEVEMENT:
      await combatTaskHandler(msgMap, playerName, extra, CA_PROGRESS, CA_URL);
      break;
    case Constants.KILL_COUNT:
      killCountHandler(msgMap, playerName, extra, KC_URL);
      break;
    case Constants.CLUE:
      clueScrollHandler(msgMap, playerName, extra, CLUE_URL);
      break;
    case Constants.LOOT:
      await lootHandler(
        msgMap,
        extra.items,
        playerName,
        extra.source,
        WEEKLY_RECAP_DB,
        LOOT_URL
      );
      break;
    case Constants.DEATH:
      await deathHandler(msgMap, playerName, extra, WEEKLY_RECAP_DB, DEATH_URL);
      break;
    case Constants.EXTERNAL_PLUGIN:
      await tcgHandler(
        msgMap,
        playerName,
        content,
        extra,
        WEEKLY_RECAP_DB,
        EXTERNAL_URL
      );
      break;
    case Constants.CHAT:
      await chatHandler(
        msgMap,
        playerName,
        extra.message,
        PB_URL,
        LOOT_URL,
        KC_URL,
        CRAB_DB
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
