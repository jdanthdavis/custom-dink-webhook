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

  // Grab skill's information that triggered the notification
  for (const [key, value] of Object.entries(levelledSkills)) {
    allLevelledSkills.push({ skillName: key, skillLevel: value });
  }

  /**
   * Constructs a multi-level message when multiple skills caused the dink
   */
  const multiLevelMsg = () => {
    let multiLevelMsg = '';
    const lastLevel = allLevelledSkills[allLevelledSkills.length - 1].skillName;
    allLevelledSkills.forEach((level) => {
      multiLevelMsg = multiLevelMsg +=
        level.skillName +
        ', ' +
        `${
          level.skillName !== lastLevel
            ? level.skillName + ', '
            : level.skillName
        }`;
    });
  };

  for (const { skillName, skillLevel } of allLevelledSkills) {
    if (totalLevel === Constants.MAX_TOTAL_LEVEL) {
      if (allLevelledSkills.length > 1) {
        msgMap.set(
          { ID: 'MAX_TOTAL_LEVEL', URL: URL },
          `-# @everyone\n<a:danseParty:1281063903933104160> **${playerName}** has reached the highest possible total level of **${
            Constants.MAX_TOTAL_LEVEL
          }**, by reaching **${skillLevel}** in **${multiLevelMsg()}!** <a:danseParty:1281063903933104160>`
        );
        break;
      }
      msgMap.set(
        { ID: 'MAX_TOTAL_LEVEL', URL: URL },
        `-# @everyone\n<a:danseParty:1281063903933104160> **${playerName}** has reached the highest possible total level of **${Constants.MAX_TOTAL_LEVEL}**, by reaching **${skillLevel}** in **${skillName}!** <a:danseParty:1281063903933104160>`
      );
    } else if (totalLevel !== 0 && totalLevel % 25 === 0) {
      if (skillLevel === 99) {
        msgMap.set(
          { ID: 'NEW_TOTAL_LEVEL', URL: URL },
          `-# @everyone\n<a:danse:1306473434221641760> **${playerName}** has reached a new total level of **${totalLevel}**, by reaching **${skillLevel}** in **${skillName}!** <a:danse:1306473434221641760>`
        );
      } else {
        msgMap.set(
          { ID: 'NEW_TOTAL_LEVEL', URL: URL },
          `**${playerName}** has reached a new total level of **${totalLevel}**, by reaching **${skillLevel}** in **${skillName}!**`
        );
      }
    } else if (skillLevel === 99) {
      msgMap.set(
        { ID: skillName, URL: URL },
        `-# @everyone\n<a:danse:1306473434221641760> **${playerName}** has levelled **${skillName} to ${skillLevel}** <a:danse:1306473434221641760>`
      );
    } else if (skillName === 'Fishing') {
      msgMap.set(
        { ID: skillName, URL: URL },
        `**${playerName}** has levelled **${skillName} to ${skillLevel}** <:fishh:1285367875531575306>`
      );
    } else {
      msgMap.set(
        { ID: skillName, URL: URL },
        `**${playerName}** has levelled **${skillName} to ${skillLevel}**!`
      );
    }
  }
}

export default checkLevelUp;
