import { formatValue } from './helperFunctions';
import {
  MAX_TOTAL_LEVEL,
  LEVEL,
  XP_MILESTONE,
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
  const { allSkills = {}, levelledSkills = {}, xpData = {} } = extra;
  const isXpMilestone = Boolean(Object.keys(xpData).length);
  const levelledSkillsLength = isXpMilestone
    ? Object.keys(xpData).length
    : Object.keys(levelledSkills).length;

  const totalLevel = Object.values(allSkills).reduce(
    (sum, skillLevel) => sum + (skillLevel > 99 ? 99 : skillLevel),
    0
  );

  /** Checks if player has reached the max total level */
  const isMaxTotalLevel = (skillLevel, totalLevel, max) =>
    skillLevel <= 99 && totalLevel === max;

  /** Returns true if total level is at a milestone (divisible by 25 or max) */
  const isTotalLevelInterval = (level) =>
    level % 25 === 0 || level === MAX_TOTAL_LEVEL;

  /** Checks if player hit a milestone total level while skilling */
  const isTotalLevelMilestone = (skillLevel, totalLevel) =>
    skillLevel <= 99 && isTotalLevelInterval(totalLevel);

  /** Checks if only one skill (Fishing) was levelled */
  const isSingleFishingLevel = (skillName, skillCount) =>
    skillName === 'Fishing' && skillCount < 2;

  /** Returns a formatted total level message */
  const getTotalLevelMessage = (
    playerName,
    totalLevel,
    multiLvlStr,
    skillLevel,
    DANSE
  ) =>
    skillLevel === 99
      ? `-# @everyone\n${DANSE} **${playerName}** has reached a new total level of **${totalLevel}**, by reaching **${multiLvlStr}!** ${DANSE}`
      : `**${playerName}** has reached a new total level of **${totalLevel}**, by reaching **${multiLvlStr}!**`;

  /** Returns a default level-up message */
  const getDefaultLevelMessage = (playerName, multiLvlStr) =>
    `**${playerName}** has levelled **${multiLvlStr}**!`;

  /** Builds the skill-level message string for 1+ skills */
  const multiLevelMsgConstructor = () => {
    const isInterval = isTotalLevelInterval(totalLevel);
    const formatSkillMessage = (name, level) =>
      isInterval ? `${level} in ${name}` : `${name} to ${level}`;

    if (levelledSkillsLength === 1) {
      const [skillName, skillLevel] = Object.entries(levelledSkills)[0];
      return formatSkillMessage(skillName, skillLevel);
    }

    const skillMessages = Object.entries(levelledSkills).map(([name, level]) =>
      formatSkillMessage(name, level)
    );

    if (levelledSkillsLength === 2) {
      return skillMessages.join(' and ');
    }

    const lastSkill = skillMessages.pop();
    return `${skillMessages.join(', ')}, and ${lastSkill}`;
  };

  for (const [skillName, skillLevel] of Object.entries(levelledSkills)) {
    const multiLvlStr = multiLevelMsgConstructor();

    if (isMaxTotalLevel(skillLevel, totalLevel, MAX_TOTAL_LEVEL)) {
      msgMap.set(
        { ID: MAX_TOTAL_LEVEL, URL },
        `-# @everyone\n${DANSE_PARTY} **${playerName}** has reached the highest possible total level of **${MAX_TOTAL_LEVEL}**, by reaching **${multiLvlStr}!** ${DANSE_PARTY}`
      );
      return msgMap;
    }

    if (isTotalLevelMilestone(skillLevel, totalLevel)) {
      msgMap.set(
        { ID: LEVEL, URL },
        getTotalLevelMessage(
          playerName,
          totalLevel,
          multiLvlStr,
          skillLevel,
          DANSE
        )
      );
      return msgMap;
    }

    if (skillLevel === 99) {
      msgMap.set(
        { ID: LEVEL, URL },
        `-# @everyone\n${DANSE} **${playerName}** has levelled **${multiLvlStr}!** ${DANSE}`
      );
      return msgMap;
    }

    if (isSingleFishingLevel(skillName, levelledSkillsLength)) {
      msgMap.set(
        { ID: LEVEL, URL },
        `**${playerName}** has levelled **${multiLvlStr}!** ${FISHH}`
      );
      return msgMap;
    }

    if (isXpMilestone) {
      const cleanedInterval = formatValue(skillLevel, true);
      msgMap.set(
        { ID: XP_MILESTONE, URL },
        `**${playerName}** has reached **${cleanedInterval} XP** in **${skillName}!**`
      );
      return msgMap;
    }

    msgMap.set(
      { ID: LEVEL, URL },
      getDefaultLevelMessage(playerName, multiLvlStr)
    );
    return msgMap;
  }

  return msgMap;
}

export default levelUpHandler;
