import * as Constants from './constants.js';
import {
  checkKc,
  checkForPB,
  totalLevelCheck,
  collectionLogCheck,
  petCheck,
  checkCAProgress,
} from './utils/Index.js';

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
    TEST_URL,
  } = env;
  const { boss: bossName, count: killCount, gameMessage } = extra || {};
  let msgMap = new Map();

  if (payloadType === Constants.PET) {
    petCheck(msgMap, playerName, extra, PET_URL);
  }

  if (payloadType === Constants.COLLECTION) {
    collectionLogCheck(msgMap, playerName, extra, COLLECTION_URL);
  }

  if (payloadType === Constants.LEVEL) {
    totalLevelCheck(msgMap, playerName, extra, LEVEL_URL);
  }

  if (payloadType === Constants.COMBAT_ACHIEVEMENT) {
    checkCAProgress(msgMap, playerName, extra, CA_URL);
  }

  if (extra?.isPersonalBest) {
    checkForPB(msgMap, playerName, bossName, PB_URL);
  }

  if (payloadType === Constants.KILL_COUNT) {
    checkKc(msgMap, bossName, killCount, playerName, gameMessage, KC_URL);
  }
  return msgMap;
}
