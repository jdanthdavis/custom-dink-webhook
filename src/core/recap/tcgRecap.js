import { formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the TCG section: score/cards/foils gained since last time. Recap-only
 * - no chat command. Pulls are recorded by `recordTcgProgress` in tcgHandler.js.
 * @param {*} WEEKLY_RECAP_DB
 * @returns {Promise<string|null>}
 */
export async function buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB) {
  const changes = await computeAndResetDeltas(WEEKLY_RECAP_DB, {
    table: 'tcg_progress',
    metrics: [
      {
        current: 'collection_score',
        baseline: 'collection_score_baseline',
        key: 'score',
      },
      {
        current: 'unique_cards_owned',
        baseline: 'unique_cards_owned_baseline',
        key: 'cards',
      },
      {
        current: 'foil_cards_owned',
        baseline: 'foil_cards_owned_baseline',
        key: 'foils',
      },
    ],
  });
  if (!changes || changes.length === 0) return null;

  const sorted = changes.sort((a, b) => b.scoreDelta - a.scoreDelta);

  const headers = ['Name', 'Score Gained', 'Cards Gained', 'Foils Gained'];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.scoreDelta.toLocaleString('en-US'),
    row.cardsDelta.toLocaleString('en-US'),
    row.foilsDelta.toLocaleString('en-US'),
  ]);

  return formatLeaderboardTable('TCG Board', headers, tableRows);
}
