import * as Constants from './constants.js';
import ChatHandler from './core/ChatHandler.js';
// import {
//   checkKc,
//   checkForPB,
//   checkLevelUp,
//   collectionLogCheck,
//   petCheck,
//   checkCAProgress,
//   formatClue,
//   formatDrop,
//   bigFish,
//   vestigeCheck,
// } from "./utils/Index.js";
import {
  checkKc,
  checkForPB,
  checkLevelUp,
  collectionLogCheck,
  petCheck,
  checkCAProgress,
} from './core/Index.js';
import { formatClue } from './core/formatters/index.js';

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

  if (payloadType === Constants.PET) {
    petCheck(msgMap, playerName, extra, PET_URL);
  }

  if (payloadType === Constants.COLLECTION) {
    collectionLogCheck(msgMap, playerName, extra, COLLECTION_URL);
  }

  if (payloadType === Constants.LEVEL) {
    checkLevelUp(msgMap, playerName, extra, LEVEL_URL);
  }

  if (payloadType === Constants.COMBAT_ACHIEVEMENT) {
    checkCAProgress(msgMap, playerName, extra, CA_URL);
  }

  if (extra?.isPersonalBest) {
    checkForPB(msgMap, playerName, extra, PB_URL);
  }

  if (payloadType === Constants.KILL_COUNT) {
    checkKc(msgMap, playerName, extra, KC_URL);
  }

  if (payloadType === Constants.CLUE) {
    formatClue(msgMap, playerName, extra, CLUE_URL);
  }

  if (payloadType === Constants.LOOT) {
    formatDrop(msgMap, playerName, extra, LOOT_URL);
  }

  if (payloadType === Constants.CHAT && extra.type === 'GAMEMESSAGE') {
    if (extra.message.includes('vestige')) {
      ChatHandler(
        msgMap,
        playerName,
        extra,
        (typeOfChat = 'VESTIGE_DROP'),
        LOOT_URL
      );
    } else {
      ChatHandler(
        msgMap,
        playerName,
        extra,
        (typeOfChat = 'BIG_FISH'),
        LOOT_URL
      );
    }
  }
  return msgMap;
}
