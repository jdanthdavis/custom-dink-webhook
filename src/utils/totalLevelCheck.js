import * as Constants from '../constants.js';

/**
 * Constructs special messages depending on the level information
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns
 */
export default function totalLevelCheck(msgMap, playerName, extra, URL) {
  const {
    allSkills = extra?.allSkills,
    levelledSkills = extra?.levelledSkills,
  } = extra || {};
  const levelledInfo = {
    skillName: '',
    level: 0,
  };
  let totalLevel = 0;

  // Get the total level of the account
  for (const [key, value] of Object.entries(allSkills)) {
    totalLevel = totalLevel + value;
  }

  // Grab skill's information that triggered the notification
  for (const [key, value] of Object.entries(levelledSkills)) {
    levelledInfo.skillName = key;
    levelledInfo.level = value;
  }

  if (totalLevel === Constants.MAX_TOTAL_LEVEL) {
    return msgMap.set(
      { ID: 'MAX_TOTAL_LEVEL', URL: URL },
      `-# @everyone\n<a:danseParty:1281063903933104160> **${playerName}** has reached the highest possible total level of **${Constants.MAX_TOTAL_LEVEL}**, by reaching **${levelledInfo.level}** in **${levelledInfo.skillName}!** <a:danseParty:1281063903933104160>`
    );
  } else if (totalLevel !== 0 && totalLevel % 25 === 0) {
    msgMap.set(
      { ID: 'NEW_TOTAL_LEVEL', URL: URL },
      `**${playerName}** has reached a new total level of **${totalLevel}**, by reaching **${levelledInfo.level}** in **${levelledInfo.skillName}!**`
    );
  } else if (levelledInfo.level === 99) {
    msgMap.set(
      { ID: levelledInfo.skillName, URL: URL },
      `-# @everyone\n<a:danse:1306473434221641760> **${playerName}** has levelled **${levelledInfo.skillName} to ${levelledInfo.level}** <a:danse:1306473434221641760>`
    );
  } else if (levelledInfo.skillName === 'Fishing') {
    msgMap.set(
      { ID: levelledInfo.skillName, URL: URL },
      `**${playerName}** has levelled **${levelledInfo.skillName} to ${levelledInfo.level}** <:fishh:1285367875531575306>`
    );
  } else {
    msgMap.set(
      { ID: levelledInfo.skillName, URL: URL },
      `**${playerName}** has levelled **${levelledInfo.skillName} to ${levelledInfo.level}**!`
    );
  }

  return msgMap;
}
