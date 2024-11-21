import * as Constants from './constants.js';
import { pet } from './utils/index.js';
// import {
//   checkKc,
//   collectionLogCheck,
//   checkCAProgress,
//   grumblerCheck,
//   sanitizedTime,
//   totalLevelCheck,
// } from './utils/Index.js';

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
  const { boss: bossName, count: killCount } = extra || {};
  let msgMap = new Map();

  if (payloadType === Constants.PET) {
    pet(msgMap, playerName, extra, TEST_URL);
  }

  // if (payloadType === Constants.COLLECTION) {
  //   collectionLogCheck(msgMap, playerName, extra, COLLECTION_URL);
  // }

  // if (payloadType === Constants.LEVEL) {
  //   totalLevelCheck(msgMap, playerName, extra, LEVEL_URL);
  // }

  // if (payloadType === Constants.COMBAT_ACHIEVEMENT) {
  //   checkCAProgress(msgMap, playerName, extra, CA_URL);
  // }

  // if (extra?.isPersonalBest) {
  //   const time = sanitizedTime(extra?.time);

  //   msgMap.set(
  //     { ID: 'PB', URL: PB_URL },
  //     `**${playerName}** has defeated **${grumblerCheck(
  //       bossName
  //     )}** with a new personal best of **${time}**`
  //   );
  // }

  // if (
  //   payloadType === Constants.KILL_COUNT &&
  //   checkKc(bossName, killCount, playerName)
  // ) {
  //   // Pulls the killCount from the actual game message and formats the message
  //   const formattedKC = extra?.gameMessage?.split(': ')[1]?.replace('.', '!');

  //   msgMap.set(
  //     { ID: 'KILL_COUNT', URL: KC_URL },
  //     `**${playerName}** has defeated **${grumblerCheck(
  //       bossName
  //     )}** with a completion count of **${formattedKC}**`
  //   );
  // }
  return msgMap;
}
