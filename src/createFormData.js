import { killCountHandler, ruleHandler } from './core';
import chatHandler from './core/chatMsgHandler/chatHandler';
import * as Constants from './constants';

/**
 * Creates the formData payload to send to a URL based on the provided payload type.
 *
 * This function handles different types of payloads, formats the relevant data,
 * and returns a message map to be sent to the appropriate URL.
 *
 * The following payload types are supported:
 * - Kill Count
 * - Loot
 * - Chat
 *
 * For more information on the payload types, see [here](https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#all).
 *
 * @param {Map} formDataMap - The map where the resulting form data is stored, including the URLs and any flags like `ruleBroken`.
 * @param {Object[]} embeds - An array of embed objects to include in the payload. These will be sent along with the message.
 * @param {string} payloadType - The type of payload to be processed (e.g., "Pet", "Collection", "Loot", etc.).
 * @param {string} playerName - The name of the player to include in the message.
 * @param {Object} extra - Additional data required for processing the payload, including specific event details.
 * @param {Object} env - An object containing the URLs for each type of payload (e.g., `PET_URL`, `KC_URL`, etc.).
 * @returns {Map} - The updated `formDataMap` containing the appropriate URLs for posting and any other relevant information, such as `ruleBroken`.
 */
function createFormData(
  formDataMap,
  embeds,
  payloadType,
  playerName,
  extra,
  env
) {
  const { KC_URL, PB_URL, CLUE_URL, LOOT_URL } = env;
  let ruleBroken = false;
  let URLs = [];

  function handleChatURL(message, PB_URL, LOOT_URL) {
    const isPersonalBest = message.includes('(new personal best)');
    return isPersonalBest ? PB_URL : LOOT_URL;
  }

  if (
    [Constants.CLUE, Constants.LOOT, Constants.CHAT].includes(payloadType) &&
    ruleHandler(ruleBroken, payloadType, extra)
  ) {
    formDataMap.set('ruleBroken', true);
    return;
  }

  switch (payloadType) {
    case Constants.KILL_COUNT:
      if (killCountHandler(extra) === false) {
        formDataMap.set('ruleBroken', true);
        return;
      }
      URLs.push(KC_URL);
      if (extra?.isPersonalBest) {
        URLs.push(PB_URL);
      }
      break;
    case Constants.LOOT:
      URLs.push(LOOT_URL);
      break;
    case Constants.CLUE:
      URLs.push(CLUE_URL);
      break;
    case Constants.CHAT:
      URLs.push(handleChatURL(extra.message, PB_URL, LOOT_URL));
      chatHandler(embeds, playerName, extra, URLs[0]);
      break;
    default:
      console.log(`Unknown payload type: ${payloadType}`);
  }

  formDataMap.set('URLs', URLs);
  formDataMap.set('ruleBroken', ruleBroken);
}

export default createFormData;
