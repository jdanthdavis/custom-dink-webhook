import { formatLeaderboardTable } from '../helperFunctions';
import { computeAndResetDeltas } from './deltaTracking';

/**
 * Builds the TCG section of the weekly recap: each player's change in
 * collection score / cards pulled / foils pulled since the *last* time this
 * ran, not their lifetime total. A player with no prior baseline (their
 * first pulls since this shipped) has their full current total counted as
 * this week's change. Players with no change since last time are omitted.
 *
 * Recap-only by design - there's no `!Fetchtcg` chat command; this data only
 * surfaces here. Pull events themselves are recorded by `recordTcgProgress`
 * in `tcgHandler.js`.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @returns {Promise<string|null>}
 */
export async function buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB) {
  const changes = await computeAndResetDeltas(WEEKLY_RECAP_DB, {
    table: 'tcg_progress',
    metrics: [
      { current: 'collection_score', baseline: 'collection_score_baseline', key: 'score' },
      { current: 'unique_cards_owned', baseline: 'unique_cards_owned_baseline', key: 'cards' },
      { current: 'foil_cards_owned', baseline: 'foil_cards_owned_baseline', key: 'foils' },
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

  return formatLeaderboardTable('TCG Board (This Week)', headers, tableRows);
}
