import * as Constants from '../constants.js';

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
      `@everyone <a:danseParty:1281063903933104160> **${playerName}** has reached the highest possible total level of **${Constants.MAX_TOTAL_LEVEL}**, by reaching **${levelledInfo.level}** in **${levelledInfo.skillName}!** <a:danseParty:1281063903933104160>`
    );
  } else if (
    levelledInfo.level === 99 &&
    levelledInfo.skillName !== 'Fishing'
  ) {
    msgMap.set(
      { ID: levelledInfo.skillName, URL: URL },
      `@everyone <a:danse:1281063902557241408> **${playerName}** has levelled **${levelledInfo.skillName} to ${levelledInfo.level}** <a:danse:1281063902557241408>`
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
