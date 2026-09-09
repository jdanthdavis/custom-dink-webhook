import { formatAsPercentage } from './helperFunctions';
import { COMBAT_ACHIEVEMENT } from '../constants';

/**
 * Reconciles this event's tierProgress against our own KV-tracked running
 * total for the player. Dink/OSRS applies every same-tick combat task
 * completion to the tier counter before firing any webhook event, so
 * simultaneous completions (e.g. one kill satisfying two tasks) arrive with
 * identical tierProgress. We track our own running total per player using
 * each event's taskPoints, capped at the authoritative payload value, so
 * same-batch siblings still display distinct, increasing numbers.
 * @param {string} playerName - The player's name
 * @param {*} extra - The payload's `extra` object
 * @param {*} [CA_PROGRESS] - KV namespace binding for combat achievement progress
 * @returns {Promise<number>} The reconciled tier progress to display
 */
async function getReconciledProgress(playerName, extra, CA_PROGRESS) {
  const { tierProgress, taskPoints, currentTier } = extra;
  if (typeof taskPoints !== 'number' || !CA_PROGRESS) return tierProgress;

  let stored = null;
  try {
    const raw = await CA_PROGRESS.get(playerName);
    if (raw) stored = JSON.parse(raw);
  } catch (error) {
    console.log(
      'CA_PROGRESS get failed - ',
      error instanceof Error ? error.message : error
    );
  }

  const progress =
    !stored || stored.currentTier !== currentTier
      ? tierProgress
      : Math.min(stored.progress + taskPoints, tierProgress);

  try {
    await CA_PROGRESS.put(
      playerName,
      JSON.stringify({ currentTier, progress })
    );
  } catch (error) {
    console.log(
      'CA_PROGRESS put failed - ',
      error instanceof Error ? error.message : error
    );
  }

  return progress;
}

/**
 * Formats the player's CA completion % with the completion of a new collection log slot
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} CA_PROGRESS - KV namespace binding used to reconcile simultaneous task completions
 * @param {*} URL - The associated URL
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>} The updated message map
 */
async function combatTaskHandler(msgMap, playerName, extra, CA_PROGRESS, URL) {
  const {
    tier,
    task: rawTask,
    tierTotalPoints,
    justCompletedTier,
    currentTier,
  } = extra;

  // Temporary safety net: strip a stray "@ach_comp@" prefix some tasks are
  // currently arriving with (e.g. "@ach_comp@Fight Caves Veteran").
  const task = rawTask?.replace('@ach_comp@', '') ?? rawTask;

  /** @param {string} [tier] */
  const formatTierText = (tier) => {
    if (!tier) return '';
    return tier[0] + tier.slice(1).toLowerCase();
  };

  const formattedTier = formatTierText(tier);
  const formattedCurrentTier = formatTierText(currentTier);
  const formattedJustCompleted = formatTierText(justCompletedTier);

  if (justCompletedTier) {
    msgMap.set(
      { ID: COMBAT_ACHIEVEMENT, URL },
      `**${playerName}** has completed the **${formattedJustCompleted} combat achievements**, by completing combat task: **${task}!**`
    );
  } else {
    // Only reconcile progress here: this is the only branch that displays
    // it, and the tier-completion message above never references it.
    const progress = await getReconciledProgress(
      playerName,
      extra,
      CA_PROGRESS
    );
    const formattedTaskPercentageCompleted = formatAsPercentage(
      progress,
      tierTotalPoints
    );

    if (!currentTier) {
      msgMap.set(
        { ID: COMBAT_ACHIEVEMENT, URL },
        `**${playerName}** has completed **${formattedTier}** combat task: **${task}** | **${progress}/${tierTotalPoints} (${formattedTaskPercentageCompleted}%)** completed til **Bronze!**`
      );
    } else {
      msgMap.set(
        { ID: COMBAT_ACHIEVEMENT, URL },
        `**${playerName}** has completed **${formattedTier}** combat task: **${task}** | **${progress}/${tierTotalPoints} (${formattedTaskPercentageCompleted}%)** of **${formattedCurrentTier}** tier completed!`
      );
    }
  }

  return msgMap;
}
export default combatTaskHandler;
