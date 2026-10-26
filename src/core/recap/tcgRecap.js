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
      {
        current: 'godly_pulls',
        baseline: 'godly_pulls_baseline',
        key: 'godlies',
      },
      {
        current: 'mythic_pulls',
        baseline: 'mythic_pulls_baseline',
        key: 'mythics',
      },
    ],
  });
  if (!changes || changes.length === 0) return null;

  // Any of these can drop (e.g. "Total cards" counts dupes, so selling them
  // lowers it) - report a drop as 0 gained rather than a negative, and leave
  // out a player with nothing gained at all.
  const gains = changes
    .map((row) => ({
      ...row,
      scoreDelta: Math.max(0, row.scoreDelta),
      cardsDelta: Math.max(0, row.cardsDelta),
      foilsDelta: Math.max(0, row.foilsDelta),
      godliesDelta: Math.max(0, row.godliesDelta),
      mythicsDelta: Math.max(0, row.mythicsDelta),
    }))
    .filter(
      (row) =>
        row.scoreDelta > 0 ||
        row.cardsDelta > 0 ||
        row.foilsDelta > 0 ||
        row.godliesDelta > 0 ||
        row.mythicsDelta > 0
    );
  if (gains.length === 0) return null;

  const sorted = gains.sort((a, b) => b.scoreDelta - a.scoreDelta);

  const headers = [
    'Name',
    'Score Gained',
    'Cards Pulled',
    'Foils Pulled',
    'Godlies Pulled',
    'Mythics Pulled',
  ];
  const tableRows = sorted.map((row) => [
    row.playername,
    row.scoreDelta.toLocaleString('en-US'),
    row.cardsDelta.toLocaleString('en-US'),
    row.foilsDelta.toLocaleString('en-US'),
    row.godliesDelta.toLocaleString('en-US'),
    row.mythicsDelta.toLocaleString('en-US'),
  ]);

  return formatLeaderboardTable('TCG Board', headers, tableRows);
}
