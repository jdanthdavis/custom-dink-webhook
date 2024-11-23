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
  const allLevelledSkills = [];
  let totalLevel = 0;
  // Get the total level of the account
  for (const [key, value] of Object.entries(allSkills)) {
    totalLevel = totalLevel + value;
  }
  // Get all skill's information that triggered the notification
  for (const [key, value] of Object.entries(levelledSkills)) {
    allLevelledSkills.push({ skillName: key, skillLevel: value });
  }
  const allLevelledSkillsLength = allLevelledSkills.length;
  const multipleLevels = allLevelledSkillsLength > 1;

  /**
   * Constructs a multi-level message when multiple skills caused the dink
   */
  const multiLevelMsgConstructor = () => {
    const isTotalLevelInterval =
      totalLevel % 25 === 0 || totalLevel === Constants.MAX_TOTAL_LEVEL;
    let skills =
      allLevelledSkillsLength === 2 || allLevelledSkillsLength > 2
        ? allLevelledSkills.map(
            (skill) => `${skill.skillLevel} in ${skill.skillName}`
          )
        : [];

    if (allLevelledSkillsLength === 1) {
      const { skillName, skillLevel } = allLevelledSkills[0];
      if (isTotalLevelInterval) {
        return `${skillLevel} in ${skillName}`; // Single skill and a total level interval
      } else {
        return `${skillName} to ${skillLevel}`; // Single skill with no total level interval
      }
    } else if (allLevelledSkillsLength === 2) {
      if (isTotalLevelInterval) {
        return skills.join(' and '); // Two skills abd a total level interval
      } else {
        skills = allLevelledSkills.map(
          (skill) => `${skill.skillName} to ${skill.skillLevel}`
        );
        return skills.join(' and '); // Two skills
      }
    } else if (allLevelledSkillsLength > 2) {
      if (isTotalLevelInterval) {
        const lastSkill = skills.pop();
        return `${skills.join(', ')}, and ${lastSkill}`; // More than two skills and a total level interval
      } else {
        skills = allLevelledSkills.map(
          (skill) => `${skill.skillName} to ${skill.skillLevel}`
        );
        const lastSkill = skills.pop();
        return `${skills.join(', ')}, and ${lastSkill}`; // More than two skills and a total level interval
      }
    }
  };

  for (const { skillName, skillLevel } of allLevelledSkills) {
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
    } else if (skillName === 'Fishing' && !multipleLevels) {
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
