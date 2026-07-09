import { formatAsPercentage } from './helperFunctions';
import { COMBAT_ACHIEVEMENT } from '../constants';

/**
 * Formats the player's CA completion % with the completion of a new collection log slot
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function combatTaskHandler(msgMap, playerName, extra, URL) {
  const {
    tier,
    task,
    tierProgress,
    tierTotalPoints,
    justCompletedTier,
    currentTier,
  } = extra;

  const formatTierText = (tier) => {
    if (!tier) return '';
    return tier[0] + tier.slice(1).toLowerCase();
  };

  const formattedTaskPercentageCompleted = formatAsPercentage(
    tierProgress,
    tierTotalPoints
  );

  const formattedTier = formatTierText(tier);
  const formattedCurrentTier = formatTierText(currentTier);
  const formattedJustCompleted = formatTierText(justCompletedTier);

  if (justCompletedTier) {
    msgMap.set(
      { ID: COMBAT_ACHIEVEMENT, URL },
      `**${playerName}** has completed the **${formattedJustCompleted} combat achievements**, by completing combat task: **${task}!**`
    );
  } else {
    if (!currentTier) {
      msgMap.set(
        { ID: COMBAT_ACHIEVEMENT, URL },
        `**${playerName}** has completed **${formattedTier}** combat task: **${task}** | **${tierProgress}/${tierTotalPoints} (${formattedTaskPercentageCompleted}%)** completed til **Bronze!**`
      );
    } else {
      msgMap.set(
        { ID: COMBAT_ACHIEVEMENT, URL },
        `**${playerName}** has completed **${formattedTier}** combat task: **${task}** | **${tierProgress}/${tierTotalPoints} (${formattedTaskPercentageCompleted}%)** of **${formattedCurrentTier}** tier completed!`
      );
    }
  }

  return msgMap;
}
export default combatTaskHandler;
