import { calculateTotalValue } from './helperFunctions';
import { RULES, LOOT, CLUE, CHAT } from '../constants';

/**
 * Checks if the provided payload violates any defined rules.
 *
 * This function evaluates the rule conditions for different payload types
 * (LOOT, CLUE) and returns `true` if the rule is broken for the given
 * payload. It uses predefined thresholds from the `RULES` object to perform
 * the checks. The payload is expected to include various types of data
 * (e.g., items) that are validated against the corresponding
 * rules for each type.
 *
 * Supported Payload Types:
 * - LOOT: Checks if the total value of loot items exceeds the minimum loot value.
 * - CLUE: Checks if the total value of clue scroll items exceeds the minimum value.
 *
 * @param {boolean} ruleBroken - A flag indicating whether the rule has been broken.
 *                               It is updated to `true` if a violation is detected.
 * @param {string} payloadType - The type of payload (LOOT, CLUE, DEATH, etc.).
 *                               Determines which rule to check.
 * @param {Array} extra.items - The list of loot or clue scroll items to be validated
 *                               against the predefined rules.
 * @returns {boolean} - Returns `true` if the rule is broken for the given payload.
 *                      Otherwise, returns `false`.
 *
 */
function ruleHandler(ruleBroken, payloadType, extra) {
  const { source, items, type: chatType } = extra;
  switch (payloadType) {
    case LOOT:
      if (
        calculateTotalValue(items) < RULES.drops.minLootValue ||
        (items.some((item) =>
          item.name.toUpperCase().includes('CONTRACT OF')
        ) &&
          source === 'Black demon')
      ) {
        ruleBroken = true;
        return ruleBroken;
      }
      break;
    case CLUE:
      if (calculateTotalValue(items) < RULES.clueScrolls.minValue) {
        ruleBroken = true;
        return ruleBroken;
      }
      break;
    case CHAT:
      if (!RULES.chat.messageTypes.includes(chatType)) {
        ruleBroken = true;
        return ruleBroken;
      }
      break;
    default:
      console.log(`ruleHandler.js | Unknown payloadType: ${payloadType}`);
  }
}

export default ruleHandler;
