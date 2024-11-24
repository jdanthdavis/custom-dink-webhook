import * as Constants from '../constants.js';

/**
 * Constructs special messages depending on the level information
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns
 */
function checkLevelUp(msgMap, playerName, extra, URL) {
  const {
    allSkills = extra?.allSkills,
    levelledSkills = extra?.levelledSkills,
  } = extra || {};
  const allLevelsMap = new Map(Object.entries(allSkills));
  const levelledSkillsMap = new Map(Object.entries(levelledSkills));
  // Get the new total level with newest level ups
  for (const [skillName, skillLevel] of levelledSkillsMap.entries()) {
    if (allLevelsMap.has(skillName)) {
      const updatedLevel = skillLevel;
      allLevelsMap.set(skillName, updatedLevel);
    }
  }
  const totalLevel = Array.from(allLevelsMap.values()).reduce(
    (sum, skillLevel) => sum + skillLevel,
    0
  );

  /**
   * Constructs a multi-level message when multiple skills caused the dink
   */
  const multiLevelMsgConstructor = () => {
    const isTotalLevelInterval =
      totalLevel % 25 === 0 || totalLevel === Constants.MAX_TOTAL_LEVEL;

    // Helper function to construct skill messages
    const constructSkillMessages = (format) =>
      Array.from(levelledSkillsMap.entries()).map(([skillName, skillLevel]) =>
        format(skillName, skillLevel)
      );

    if (levelledSkillsMap.size === 1) {
      const [skillName, skillLevel] = levelledSkillsMap.entries().next().value;
      return isTotalLevelInterval
        ? `${skillLevel} in ${skillName}`
        : `${skillName} to ${skillLevel}`;
    }

    // Determine message formatting
    const skillMessages = isTotalLevelInterval
      ? constructSkillMessages((name, level) => `${level} in ${name}`)
      : constructSkillMessages((name, level) => `${name} to ${level}`);

    if (levelledSkillsMap.size === 2) {
      return skillMessages.join(' and ');
    }

    if (levelledSkillsMap.size > 2) {
      const lastSkill = skillMessages.pop();
      return `${skillMessages.join(', ')}, and ${lastSkill}`;
    }
  };

  for (const [skillName, skillLevel] of levelledSkillsMap.entries()) {
    let multiLvlStr = multiLevelMsgConstructor();
    if (totalLevel === Constants.MAX_TOTAL_LEVEL) {
      msgMap.set(
        { ID: 'Constants.MAX_TOTAL_LEVEL', URL },
        `-# @everyone\n<a:danseParty:1281063903933104160> **${playerName}** has reached the highest possible total level of **${Constants.MAX_TOTAL_LEVEL}**, by reaching **${multiLvlStr}!** <a:danseParty:1281063903933104160>`
      );
      break;
    } else if (totalLevel !== 0 && totalLevel % 25 === 0) {
      if (skillLevel === 99) {
        msgMap.set(
          { ID: 'NEW_TOTAL_LEVEL', URL },
          `-# @everyone\n<a:danse:1306473434221641760> **${playerName}** has reached a new total level of **${totalLevel}**, by reaching **${multiLvlStr}!** <a:danse:1306473434221641760>`
        );
      } else {
        msgMap.set(
          { ID: 'NEW_TOTAL_LEVEL', URL },
          `**${playerName}** has reached a new total level of **${totalLevel}**, by reaching **${multiLvlStr}!**`
        );
      }
      break;
    } else if (skillLevel === 99) {
      msgMap.set(
        { ID: skillName, URL },
        `-# @everyone\n<a:danse:1306473434221641760> **${playerName}** has levelled **${multiLvlStr}!** <a:danse:1306473434221641760>`
      );
      break;
    } else if (skillName === 'Fishing' && levelledSkillsMap.size < 2) {
      msgMap.set(
        { ID: skillName, URL },
        `**${playerName}** has levelled **${multiLvlStr}!** <:fishh:1285367875531575306>`
      );
      break;
    } else {
      msgMap.set(
        { ID: skillName, URL },
        `**${playerName}** has levelled **${multiLvlStr}**!`
      );
      break;
    }
  }
}

export default checkLevelUp;
