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
  const levelledSkillsLength = Object.keys(levelledSkills)?.length;
  // Dink's allSkills correctly reflects the levelledSkills values
  // e,g., Levelling Attack to 99 will show Attack is level 99 in allSkills
  const totalLevel = Object.values(allSkills).reduce(
    (sum, skillLevel) => sum + (skillLevel > 99 ? 99 : skillLevel),
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
      Object.entries(levelledSkills).map(([skillName, skillLevel]) =>
        format(skillName, skillLevel)
      );

    if (levelledSkillsLength === 1) {
      const [skillName, skillLevel] = Object.entries(levelledSkills)[0];
      return isTotalLevelInterval
        ? `${skillLevel} in ${skillName}`
        : `${skillName} to ${skillLevel}`;
    }

    // Determine message formatting
    const skillMessages = isTotalLevelInterval
      ? constructSkillMessages((name, level) => `${level} in ${name}`)
      : constructSkillMessages((name, level) => `${name} to ${level}`);

    if (levelledSkillsLength === 2) {
      return skillMessages.join(' and ');
    }

    if (levelledSkillsLength > 2) {
      const lastSkill = skillMessages.pop();
      return `${skillMessages.join(', ')}, and ${lastSkill}`;
    }
  };

  for (const [skillName, skillLevel] of Object.entries(levelledSkills)) {
    let multiLvlStr = multiLevelMsgConstructor();
    if (totalLevel === Constants.MAX_TOTAL_LEVEL) {
      msgMap.set(
        { ID: 'MAX_TOTAL_LEVEL', URL },
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
    } else if (skillName === 'Fishing' && levelledSkillsLength < 2) {
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
