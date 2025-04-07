import { RULES, LOOT, DEATH, CLUE } from '../constants';

function ruleHandler(ruleBroken, payloadType, extra) {
  switch (payloadType) {
    case LOOT:
      // check loot min value
      break;
    case DEATH:
      //TODO: Implement safeDeath regions
      if (
        extra.valueLost < RULES.deaths.minLostValue ||
        RULES.deaths.ignoreSafeDeaths.includes(extra.location.regionId)
      )
        return (ruleBroken = true);
    case CLUE:
    // check loot min value
    default:
      console.log('error');
  }
}

export default ruleHandler;
