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
 * Routes a Dink payload to its handler by payload type and builds the message map.
 * See {@link https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#all}.
 * @param {*} extra
 * @param {*} content - raw content string, used by EXTERNAL_PLUGIN
 * @param {*} payloadType
 * @param {string} playerName
 * @param {*} env
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>}
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
      await levelUpHandler(
        msgMap,
        playerName,
        extra,
        WEEKLY_RECAP_DB,
        LEVEL_URL
      );
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
