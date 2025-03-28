import { formatAsPercentage } from './formatters';

/**
 * Formats the player's CA completion % with the completion of a new collection log slot
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 */
function CombatTaskHandler(msgMap, playerName, extra, URL) {
  const {
    tier,
    task,
    totalPoints,
    tierProgress,
    tierTotalPoints,
    justCompletedTier,
    totalPossiblePoints,
    currentTier,
  } = extra;

  const formatAsPercentage = (value, total) => {
    return total && total > 0
      ? formatAsPercentage((value / total) * 100)
      : '0%';
  };

  const formattedTaskPercentageCompleted = formatAsPercentage(
    tierProgress,
    tierTotalPoints
  );
  const formattedTotalCACompletion = formatAsPercentage(
    totalPoints,
    totalPossiblePoints
  );

  const formattedTier =
    tier?.charAt(0) + tier?.substring(1).toLowerCase() ?? '';
  const formattedCurrentTier =
    currentTier?.charAt(0) + currentTier?.substring(1).toLowerCase() ?? '';
  const formattedJustCompleted =
    justCompletedTier?.charAt(0).toUpperCase() +
      justCompletedTier?.substring(1).toLowerCase() ?? '';

  if (justCompletedTier) {
    msgMap.set(
      { ID: 'CA', URL },
      `**${playerName}** has completed the **${formattedJustCompleted} combat achievements**, by completing combat task: **${task}!**${
        justCompletedTier !== 'GRANDMASTER'
          ? `\n-# ${totalPoints}/${totalPossiblePoints} (${formattedTotalCACompletion}%) of total points for Grandmasters`
          : ``
      }`
    );
  } else {
    msgMap.set(
      { ID: 'CA', URL },
      `**${playerName}** has completed **${formattedTier}** combat task: **${task} | ${tierProgress}/${tierTotalPoints} (${formattedTaskPercentageCompleted}%) of ${formattedCurrentTier} of tier completed!**`
    );
  }
}

export default CombatTaskHandler;
