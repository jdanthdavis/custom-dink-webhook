import {
  ChatHandler,
  CollectionLogHandler,
  PetHandler,
  CombatTaskHandler,
  KillCountHandler,
  LevelUpHandler,
  PersonalBestHandler,
  ClueScrollHandler,
} from './core';
import * as Constants from './Constants';
import * as Chat_Constants from './core/chatHandler/Constants';

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
export function CreateFormData(extra, payloadType, playerName, env) {
  const {
    KC_URL,
    PB_URL,
    COLLECTION_URL,
    PET_URL,
    LEVEL_URL,
    CA_URL,
    CLUE_URL,
    LOOT_URL,
  } = env;

  let msgMap = new Map();

  switch (payloadType) {
    case Constants.PET:
      PetHandler(msgMap, playerName, extra, PET_URL);
      break;
    case Constants.COLLECTION:
      CollectionLogHandler(msgMap, playerName, extra, COLLECTION_URL);
      break;
    case Constants.LEVEL:
      LevelUpHandler(msgMap, playerName, extra, LEVEL_URL);
      break;
    case Constants.COMBAT_ACHIEVEMENT:
      CombatTaskHandler(msgMap, playerName, extra, CA_URL);
      break;
    case Constants.KILL_COUNT:
      KillCountHandler(msgMap, playerName, extra, KC_URL);
      break;
    case Constants.CLUE:
      ClueScrollHandler(msgMap, playerName, extra, CLUE_URL);
      break;
    case Constants.LOOT:
      formatDrop(msgMap, playerName, extra, LOOT_URL);
      break;
    case Constants.CHAT:
      const isPersonalBest = extra.message.includes('(new personal best)');
      const typeOfChat = isPersonalBest
        ? Chat_Constants.CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST
        : extra.message.includes('vestige')
        ? Chat_Constants.CHAT_MESSAGE_TYPES.VESTIGE_DROP
        : Chat_Constants.CHAT_MESSAGE_TYPES.BIG_FISH;

      const URL = isPersonalBest ? PB_URL : LOOT_URL;

      ChatHandler(msgMap, playerName, extra, typeOfChat, URL);

      break;
    default:
      console.log(`Unknown payload type: ${payloadType}`);
  }

  if (extra?.isPersonalBest) {
    PersonalBestHandler(msgMap, playerName, extra, PB_URL);
  }

  return msgMap;
}
