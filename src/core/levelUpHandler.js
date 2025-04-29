import {
  MAX_TOTAL_LEVEL,
  LEVEL,
  DANSE,
  DANSE_PARTY,
  FISHH,
} from '../constants';

/**
 * Constructs special messages depending on the level information
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function levelUpHandler(msgMap, playerName, extra, URL) {
  const { allSkills = {}, levelledSkills = {} } = extra;
  const levelledSkillsLength = Object.keys(levelledSkills).length;

  // Calculate total level but cap values at 99
  const totalLevel = Object.values(allSkills).reduce(
    (sum, skillLevel) => sum + (skillLevel > 99 ? 99 : skillLevel),
    0
  );

  /**
   * Check if the total level is at an important interval (multiple of 25)
   * @param {number} level
   * @returns {boolean} - True if total level is divisible by 25 or max total level
   */
  const isImportantLevelInterval = (level) =>
    level % 25 === 0 || level === MAX_TOTAL_LEVEL;

  /**
   * Constructs a message based on multiple level-ups
   * @returns {string} - The constructed message
   */
  const multiLevelMsgConstructor = () => {
    const isTotalLevelInterval = isImportantLevelInterval(totalLevel);
    const formatSkillMessage = (name, level) =>
      isTotalLevelInterval ? `${level} in ${name}` : `${name} to ${level}`;

    if (levelledSkillsLength === 1) {
      const [skillName, skillLevel] = Object.entries(levelledSkills)[0];
      return isTotalLevelInterval
        ? `${skillLevel} in ${skillName}`
        : `${skillName} to ${skillLevel}`;
    }

    // Construct skill messages for multiple level-ups
    const skillMessages = Object.entries(levelledSkills).map(([name, level]) =>
      formatSkillMessage(name, level)
    );

    if (levelledSkillsLength === 2) {
      return skillMessages.join(' and ');
    }

    if (levelledSkillsLength > 2) {
      const lastSkill = skillMessages.pop();
      return `${skillMessages.join(', ')}, and ${lastSkill}`;
    }
  };

  // Build the level-up message based on the player's skill level and total level
  for (const [skillName, skillLevel] of Object.entries(levelledSkills)) {
    const multiLvlStr = multiLevelMsgConstructor();

    if (skillLevel <= 99 && totalLevel === MAX_TOTAL_LEVEL) {
      msgMap.set(
        { ID: MAX_TOTAL_LEVEL, URL },
        `-# @everyone\n${DANSE_PARTY} **${playerName}** has reached the highest possible total level of **${MAX_TOTAL_LEVEL}**, by reaching **${multiLvlStr}!** ${DANSE_PARTY}`
      );
      break;
    } else if (skillLevel <= 99 && isImportantLevelInterval(totalLevel)) {
      const levelMessage =
        skillLevel === 99
          ? `-# @everyone\n${DANSE} **${playerName}** has reached a new total level of **${totalLevel}**, by reaching **${multiLvlStr}!** ${DANSE}`
          : `**${playerName}** has reached a new total level of **${totalLevel}**, by reaching **${multiLvlStr}!**`;

      msgMap.set({ ID: LEVEL, URL }, levelMessage);
      break;
    } else if (skillLevel === 99) {
      msgMap.set(
        { ID: LEVEL, URL },
        `-# @everyone\n${DANSE} **${playerName}** has levelled **${multiLvlStr}!** ${DANSE}`
      );
      break;
    } else if (skillName === 'Fishing' && levelledSkillsLength < 2) {
      msgMap.set(
        { ID: LEVEL, URL },
        `**${playerName}** has levelled **${multiLvlStr}!** ${FISHH}`
      );
      break;
    } else {
      msgMap.set(
        { ID: LEVEL, URL },
        `**${playerName}** has levelled **${multiLvlStr}**!`
      );
      break;
    }
  }

  return msgMap;
}

export default levelUpHandler;
