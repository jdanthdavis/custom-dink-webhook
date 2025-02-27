import * as Constants from './constants.js';

/**
 * Randomly pulls a big fish message when a player catches a big fish
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns
 */
function bigFish(msgMap, playerName, extra, URL) {
  const { message } = extra || {};

  const fish = message.match(/You catch an enormous (.+)!/);
  const randomIndex = Math.floor(Math.random() * Constants.bigFishArr.length);
  const msg = bigFishArr[randomIndex]
    .replace(/\[FISH\]/g, fish)
    .replace(/\[PLAYER\]/g, playerName);

  msgMap.set({ ID: 'BIG_FISH', URL: URL }, msg);

  return msgMap;
}

export default bigFish;
