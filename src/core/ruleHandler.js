import { calculateTotalValue } from './helperFunctions';
import { RULES, LOOT, DEATH, CLUE } from '../constants';

/**
 * Checks if the provided payload violates any defined rules.
 *
 * This function evaluates the rule conditions for different payload types
 * (LOOT, CLUE, DEATH) and returns `true` if the rule is broken for the given
 * payload. It uses predefined thresholds from the `RULES` object to perform
 * the checks. The payload is expected to include various types of data
 * (e.g., items, valueLost) that are validated against the corresponding
 * rules for each type.
 *
 * Supported Payload Types:
 * - LOOT: Checks if the total value of loot items exceeds the minimum loot value.
 * - CLUE: Checks if the total value of clue scroll items exceeds the minimum value.
 * - DEATH: Checks if the value lost in a death event is below the minimum threshold or if the death occurs in a safe region.
 *
 * @param {boolean} ruleBroken - A flag indicating whether the rule has been broken.
 *                               It is updated to `true` if a violation is detected.
 * @param {string} payloadType - The type of payload (LOOT, CLUE, DEATH, etc.).
 *                               Determines which rule to check.
 * @param {Object} extra - The extra data for the payload, which contains specific values
 *                          for checking the rules (e.g., items, valueLost).
 * @returns {boolean} - Returns `true` if the rule is broken for the given payload.
 *                      Otherwise, returns `false`.
 *
 */
function ruleHandler(ruleBroken, payloadType, extra) {
  switch (payloadType) {
    // case LOOT:
    //   if (calculateTotalValue(extra.items) < RULES.drops.minLootValue) {
    //     ruleBroken = true;
    //     return ruleBroken;
    //   }
    //   break;
    case CLUE:
      if (calculateTotalValue(extra.items) < RULES.clueScrolls.minValue) {
        ruleBroken = true;
        return ruleBroken;
      }
      break;
    case DEATH:
      if (
        extra.valueLost < RULES.deaths.minLostValue ||
        RULES.deaths.ignoreSafeDeaths.includes(extra.location.regionId)
      ) {
        ruleBroken = true;
        return ruleBroken;
      }
      break;
    default:
      console.log(`ruleHandler.js | Unknown payloadType: ${payloadType}`);
  }
}

export default ruleHandler;
