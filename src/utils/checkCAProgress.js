import formatPercentage from './formatPercentage.js';

export default function checkCAProgress(msgMap, playerName, extra, URL) {
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
  const formattedTaskPercentageCompleted = formatPercentage(
    (tierProgress / tierTotalPoints) * 100
  );
  const formattedTotalCaCompletion = formatPercentage(
    (totalPoints / totalPossiblePoints) * 100
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
      { ID: 'CA', URL: URL },
      `**${playerName}** has completed the **${formattedJustCompleted}** combat achievements, by completing combat task: **${task}!**\n-# ${totalPoints}/${totalPossiblePoints} (${formattedTotalCaCompletion}%) of total points for Grandmasters`
    );
  } else {
    msgMap.set(
      { ID: 'CA', URL: URL },
      `**${playerName}** has completed **${formattedTier}** combat task: **${task} | ${tierProgress}/${tierTotalPoints} (${formattedTaskPercentageCompleted}%) of ${formattedCurrentTier} of tier completed**`
    );
  }
}
