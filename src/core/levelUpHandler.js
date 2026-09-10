import { formatValue, formatLists } from './helperFunctions';
import {
  MAX_TOTAL_LEVEL,
  LEVEL,
  XP_MILESTONE,
  LEVEL_NOTIFICATION_THRESHOLD,
  DANSE,
  DANSE_PARTY,
  FISHH,
} from '../constants';

/**
 * Upserts each levelled skill's current level into `skill_levels` for the
 * weekly recap - unconditional, regardless of LEVEL_NOTIFICATION_THRESHOLD.
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} playername
 * @param {Record<string, number>} levelledSkills - skill name -> new level
 */
async function recordSkillLevels(WEEKLY_RECAP_DB, playername, levelledSkills) {
  const entries = Object.entries(levelledSkills);
  if (entries.length === 0) return;

  try {
    await Promise.all(
      entries.map(([skillName, skillLevel]) =>
        WEEKLY_RECAP_DB.prepare(
          `INSERT INTO skill_levels (playername, skill_name, level)
           VALUES (?1, ?2, ?3)
           ON CONFLICT(playername, skill_name) DO UPDATE SET
             level = COALESCE(?3, level)`
        )
          .bind(playername, skillName, skillLevel ?? null)
          .run()
      )
    );
  } catch (error) {
    console.log(
      'recordSkillLevels ',
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Constructs level-up/XP-milestone messages.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} WEEKLY_RECAP_DB
 * @param {*} URL
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>}
 */
async function levelUpHandler(msgMap, playerName, extra, WEEKLY_RECAP_DB, URL) {
  const {
    allSkills = {},
    levelledSkills = {},
    xpData = {},
    milestoneAchieved,
  } = extra;

  /** Sends a custom message for an XP milestone */
  if (Object.keys(xpData).length > 0) {
    msgMap.set(
      { ID: XP_MILESTONE, URL },
      `**${playerName}** has reached **${formatValue(
        xpData[milestoneAchieved[0]],
        true
      )} XP** in **${milestoneAchieved[0]}!**`
    );
    return msgMap;
  }

  // Tracked unconditionally, before any of the notification-gating logic
  // below - every level counts toward the weekly recap even though only
  // levels >= LEVEL_NOTIFICATION_THRESHOLD get a Discord message.
  await recordSkillLevels(WEEKLY_RECAP_DB, playerName, levelledSkills);

  // Discord notifications stay limited to LEVEL_NOTIFICATION_THRESHOLD+,
  // same as before Dink started sending every level - a mixed event (e.g.
  // one skill below the threshold, one at/above) still notifies for just
  // the qualifying skill(s).
  const qualifyingLevelledSkills = Object.fromEntries(
    Object.entries(levelledSkills).filter(
      ([, skillLevel]) => skillLevel >= LEVEL_NOTIFICATION_THRESHOLD
    )
  );

  const levelledSkillsLength = Object.keys(qualifyingLevelledSkills).length;
  const totalLevel = Object.values(allSkills).reduce(
    (sum, skillLevel) => sum + (skillLevel > 99 ? 99 : skillLevel),
    0
  );

  /**
   * Checks if player has reached the max total level
   * @param {number} skillLevel @param {number} totalLevel @param {number} max
   */
  const isMaxTotalLevel = (skillLevel, totalLevel, max) =>
    skillLevel <= 99 && totalLevel === max;

  /**
   * Returns true if total level is at a milestone (divisible by 25 or max)
   * @param {number} level
   */
  const isTotalLevelInterval = (level) =>
    level % 25 === 0 || level === MAX_TOTAL_LEVEL;

  /**
   * Checks if player hit a milestone total level while skilling
   * @param {number} skillLevel @param {number} totalLevel
   */
  const isTotalLevelMilestone = (skillLevel, totalLevel) =>
    skillLevel <= 99 && isTotalLevelInterval(totalLevel);

  /**
   * Checks if only one skill (Fishing) was levelled
   * @param {string} skillName @param {number} skillCount
   */
  const isSingleFishingLevel = (skillName, skillCount) =>
    skillName === 'Fishing' && skillCount < 2;

  /**
   * Checks if allSkills contains exactly one skill at level 99 (i.e. a player's first ever 99)
   * @param {Record<string, number>} allSkills
   */
  const isFirstNinetyNine = (allSkills) =>
    Object.values(allSkills).filter((level) => level === 99).length === 1;

  /**
   * Returns a formatted total level message
   * @param {string} playerName @param {number} totalLevel @param {string} multiLvlStr @param {number} skillLevel @param {string} DANSE
   */
  const getTotalLevelMessage = (
    playerName,
    totalLevel,
    multiLvlStr,
    skillLevel,
    DANSE
  ) =>
    skillLevel === 99
      ? `-# @everyone\n${DANSE} **${playerName}** has reached a new total level of **${totalLevel}**, by reaching ${multiLvlStr} ${DANSE}`
      : `**${playerName}** has reached a new total level of **${totalLevel}**, by reaching ${multiLvlStr}`;

  /**
   * Returns a default level-up message
   * @param {string} playerName @param {string} multiLvlStr
   */
  const getDefaultLevelMessage = (playerName, multiLvlStr) =>
    `**${playerName}** has levelled ${multiLvlStr}`;

  /** Builds the skill-level message string for 1+ skills */
  const multiLevelMsgConstructor = () => {
    const isInterval = isTotalLevelInterval(totalLevel);

    /** @param {string} name @param {number} level @param {boolean} isLast */
    const formatSkillMessage = (name, level, isLast) => {
      const bang = isLast ? '!' : '';
      return isInterval
        ? `**${level}** in **${name}${bang}**`
        : `**${name}** to **${level}${bang}**`;
    };

    const entries = Object.entries(qualifyingLevelledSkills);

    if (levelledSkillsLength === 1) {
      const [skillName, skillLevel] = entries[0];
      return formatSkillMessage(skillName, skillLevel, true);
    }

    const skillMessages = entries.map(([name, level], i) =>
      formatSkillMessage(name, level, i === entries.length - 1)
    );

    return formatLists(skillMessages);
  };

  const firstLevelledEntry = Object.entries(qualifyingLevelledSkills)[0];
  if (!firstLevelledEntry) return msgMap;

  const [skillName, skillLevel] = firstLevelledEntry;
  const multiLvlStr = multiLevelMsgConstructor();

  if (skillLevel === 99 && isFirstNinetyNine(allSkills)) {
    msgMap.set(
      { ID: LEVEL, URL },
      `-# @everyone\n${DANSE} **${playerName}** has achieved their first **99** in **${skillName}!** ${DANSE}`
    );
    return msgMap;
  }

  if (isMaxTotalLevel(skillLevel, totalLevel, MAX_TOTAL_LEVEL)) {
    msgMap.set(
      { ID: MAX_TOTAL_LEVEL.toString(), URL },
      `-# @everyone\n${DANSE_PARTY} **${playerName}** has reached the highest possible total level of **${MAX_TOTAL_LEVEL}**, by reaching ${multiLvlStr} ${DANSE_PARTY}`
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
      `-# @everyone\n${DANSE} **${playerName}** has levelled ${multiLvlStr} ${DANSE}`
    );
    return msgMap;
  }

  if (isSingleFishingLevel(skillName, levelledSkillsLength)) {
    msgMap.set(
      { ID: LEVEL, URL },
      `**${playerName}** has levelled ${multiLvlStr} ${FISHH}`
    );
    return msgMap;
  }

  msgMap.set(
    { ID: LEVEL, URL },
    getDefaultLevelMessage(playerName, multiLvlStr)
  );
  return msgMap;
}

export default levelUpHandler;
