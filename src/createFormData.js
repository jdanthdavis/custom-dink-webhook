import * as Constants from './constants.js';
import {
  ChatHandler,
  CollectionLogHandler,
  PetHandler,
  CombatTaskHandler,
  KillCountHandler,
  LevelUpHandler,
  PersonalBestHandler,
  ClueScrollHandler,
  ChatHandler,
} from './core';

/**
 * Creates the formData payload to send to a URL
 * @param {*} extra
 * @param {*} payloadType
 * @param {*} playerName
 * @param {*} env
 * @returns
 */
export function createFormData(extra, payloadType, playerName, env) {
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
        ? 'NEW_PERSONAL_BEST'
        : extra.message.includes('vestige')
        ? 'VESTIGE_DROP'
        : 'BIG_FISH';

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
