import { killCountHandler, ruleHandler, personalBestHandler } from './core';
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
 * @param {Map} formDataMap - The map where the resulting form data is stored, including the URL and any flags like `ruleBroken`.
 * @param {Object[]} embeds - An array of embed objects to include in the payload. These will be sent along with the message.
 * @param {string} payloadType - The type of payload to be processed (e.g., "Pet", "Collection", "Loot", etc.).
 * @param {string} playerName - The name of the player to include in the message.
 * @param {Object} extra - Additional data required for processing the payload, including specific event details.
 * @param {Object} env - An object containing the URLs for each type of payload (e.g., `PET_URL`, `KC_URL`, etc.).
 * @returns {Map} - The updated `formDataMap` containing the appropriate URL for posting and any other relevant information, such as `ruleBroken`.
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
  let urlEmbedPairs = [];

  if (
    [Constants.CLUE, Constants.LOOT, Constants.CHAT].includes(payloadType) &&
    ruleHandler(ruleBroken, payloadType, extra.items, extra.type)
  ) {
    formDataMap.set('ruleBroken', true);
    return;
  }

  switch (payloadType) {
    case Constants.KILL_COUNT:
      const { isKillCountValid, killCountEmbed } = killCountHandler(
        extra,
        embeds,
        playerName
      );
      if (!isKillCountValid) {
        formDataMap.set('ruleBroken', true);
        return;
      }
      urlEmbedPairs.push({ url: KC_URL, embeds: killCountEmbed });

      if (extra?.isPersonalBest) {
        const personalBestEmbed = personalBestHandler(
          extra,
          embeds,
          playerName
        );
        urlEmbedPairs.push({ url: PB_URL, embeds: personalBestEmbed });
      }
      break;
    case Constants.LOOT:
      urlEmbedPairs.push({ url: LOOT_URL, embeds });
      break;
    case Constants.CLUE:
      urlEmbedPairs.push({ url: CLUE_URL, embeds });
      break;
    case Constants.CHAT:
      const { chatURL, chatEmbed } = chatHandler(
        embeds,
        playerName,
        extra.message,
        LOOT_URL,
        PB_URL
      );
      console.log('chatEmbed: ', chatEmbed);
      urlEmbedPairs.push({ url: chatURL, embeds: chatEmbed });
      break;
    default:
      console.log(`Unknown payload type: ${payloadType}`);
  }

  formDataMap.set('URLs', urlEmbedPairs);
  formDataMap.set('ruleBroken', ruleBroken);
}

export default createFormData;
