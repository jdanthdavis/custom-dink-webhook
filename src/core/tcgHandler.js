import { EXTERNAL_PLUGIN } from '../constants';
import { formatDate } from './helperFunctions';

const ACCEPTED_RARITIES = ['Mythic', 'Godly', 'Legendary'];
const FOIL_MILESTONE_INTERVAL = 50;
const CARD_MILESTONE_INTERVAL = 250;

/**
 * Extracts owned/total card progress, e.g. "215/500 (43.0%)".
 * @param {string} content
 * @returns {string|null}
 */
function extractCardProgress(content) {
  const gameTotalMatch = content?.match(
    /Unique cards: [\d ]+ \/ ([\d ]+) \([\d.]+%\)/
  );
  if (!gameTotalMatch) return null;

  const totalCardsMatch = content?.match(/Total cards: ([\d ]+)/);
  if (!totalCardsMatch) return null;

  const gameTotal = Number(gameTotalMatch[1].replace(/ /g, ''));
  const totalCards = Number(totalCardsMatch[1].replace(/ /g, ''));

  const formattedOwned = totalCards.toLocaleString('en-US');
  const formattedTotal = gameTotal.toLocaleString('en-US');
  const percentage = ((totalCards / gameTotal) * 100).toFixed(1);

  return `${formattedOwned}/${formattedTotal} (${percentage}%)`;
}

/**
 * Extracts the opened-packs count, thousands-separated.
 * @param {string} content
 * @returns {string|null}
 */
function extractOpenedPacks(content) {
  const match = content?.match(/Opened packs: ([\d ]+)/);
  return match
    ? Number(match[1].replace(/ /g, '')).toLocaleString('en-US')
    : null;
}

/**
 * Extracts unique-foil-card progress, e.g. "12/500 (2.4%)".
 * @param {string} content
 * @returns {string|null}
 */
function extractFoilCardProgress(content) {
  const match = content?.match(
    /Unique foil cards: ([\d ]+) \/ ([\d ]+) \(([\d.]+)%\)/
  );
  if (!match) return null;

  const owned = Number(match[1].replace(/ /g, '')).toLocaleString('en-US');
  const total = Number(match[2].replace(/ /g, '')).toLocaleString('en-US');

  return `${owned}/${total} (${match[3]}%)`;
}

/**
 * Raw unique-foil-cards-owned count, used for interval milestones.
 * @param {string} content
 * @returns {number|null}
 */
function extractFoilOwnedCount(content) {
  const match = content?.match(/Unique foil cards: ([\d ]+) \/ [\d ]+ \(/);
  return match ? Number(match[1].replace(/ /g, '')) : null;
}

/**
 * Reads "Total cards" (every pull, dupes included) despite the name - matches
 * the message display and D1 tracking convention, not the distinct-cards figure.
 * @param {string} content
 * @returns {number|null}
 */
function extractUniqueCardOwnedCount(content) {
  const match = content?.match(/Total cards: ([\d ]+)/);
  return match ? Number(match[1].replace(/ /g, '')) : null;
}

/**
 * Extracts collection score and percentage, e.g. "1,234 (12.3%)".
 * @param {string} content
 * @returns {string|null}
 */
function extractCollectionScore(content) {
  const match = content?.match(/Collection score: ([\d ]+) \(([\d.]+)%\)/);
  if (!match) return null;

  const score = Number(match[1].replace(/ /g, '')).toLocaleString('en-US');
  return `${score} (${match[2]}%)`;
}

/**
 * Raw collection score, used for D1 tracking.
 * @param {string} content
 * @returns {number|null}
 */
function extractCollectionScoreValue(content) {
  const match = content?.match(/Collection score: ([\d ]+) \(/);
  return match ? Number(match[1].replace(/ /g, '')) : null;
}

/**
 * Raw "Total foil cards" count (dupes included), used for D1 tracking only.
 * @param {string} content
 * @returns {number|null}
 */
function extractTotalFoilCards(content) {
  const match = content?.match(/Total foil cards: ([\d ]+)/);
  return match ? Number(match[1].replace(/ /g, '')) : null;
}

/**
 * Game's total possible unique cards, used for D1 tracking.
 * @param {string} content
 * @returns {number|null}
 */
function extractUniqueCardsTotal(content) {
  const match = content?.match(/Unique cards: [\d ]+ \/ ([\d ]+) \(/);
  return match ? Number(match[1].replace(/ /g, '')) : null;
}

/**
 * Game's total possible unique foil cards, used for D1 tracking.
 * @param {string} content
 * @returns {number|null}
 */
function extractFoilCardsTotal(content) {
  const match = content?.match(/Unique foil cards: [\d ]+ \/ ([\d ]+) \(/);
  return match ? Number(match[1].replace(/ /g, '')) : null;
}

/**
 * Raw opened-packs count, used for D1 tracking.
 * @param {string} content
 * @returns {number|null}
 */
function extractOpenedPacksValue(content) {
  const match = content?.match(/Opened packs: ([\d ]+)/);
  return match ? Number(match[1].replace(/ /g, '')) : null;
}

/**
 * Strips a trailing " (X%)" suffix, e.g. "215/5,173 (4.2%)" -> "215/5,173".
 * @param {string|null|undefined} stat
 * @returns {string|null|undefined}
 */
function stripPercentage(stat) {
  return stat?.replace(/ \([\d.]+%\)$/, '') ?? stat;
}

/**
 * Whether count lands exactly on a milestone interval, e.g. isMilestone(100, 50) -> true.
 * @param {number|null} count
 * @param {number} interval
 * @returns {boolean}
 */
function isMilestone(count, interval) {
  return count !== null && count % interval === 0;
}

/**
 * Builds the pull-line message, using a milestone variant when the foil or
 * card count lands exactly on its interval.
 * @param {object} params
 * @param {string} params.playerName
 * @param {string} params.rarityTier
 * @param {string} params.cardLabel
 * @param {string|null} params.openedPacks
 * @param {boolean} params.foil
 * @param {number|null} params.foilOwnedCount
 * @param {number|null} params.uniqueCardOwnedCount
 * @returns {string}
 */
function buildPullLine({
  playerName,
  rarityTier,
  cardLabel,
  openedPacks,
  foil,
  foilOwnedCount,
  uniqueCardOwnedCount,
}) {
  const cardDescriptor = `a **${rarityTier} ${cardLabel}**`;
  const foilTag = ' :sparkles: *foil* :sparkles:';
  const packSuffix = `on pack **${openedPacks}!**`;

  if (foil && isMilestone(foilOwnedCount, FOIL_MILESTONE_INTERVAL)) {
    return `**${playerName}** has pulled their **${foilOwnedCount}th** foil by pulling ${cardDescriptor}${foilTag} ${packSuffix}`;
  }

  if (!foil && isMilestone(uniqueCardOwnedCount, CARD_MILESTONE_INTERVAL)) {
    return `**${playerName}** has pulled their **${uniqueCardOwnedCount}th** card by pulling ${cardDescriptor} ${packSuffix}`;
  }

  return foil
    ? `**${playerName}** has pulled ${cardDescriptor}${foilTag} ${packSuffix}`
    : `**${playerName}** has pulled ${cardDescriptor} ${packSuffix}`;
}

/**
 * Upserts a player's TCG progress snapshot for the weekly recap (dupes
 * included; missing stats are preserved via COALESCE).
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} playername
 * @param {string} content
 * @param {string} cardName
 */
async function recordTcgProgress(
  WEEKLY_RECAP_DB,
  playername,
  content,
  cardName
) {
  try {
    await WEEKLY_RECAP_DB.prepare(
      `INSERT INTO tcg_progress (playername, collection_score, unique_cards_owned, unique_cards_total, foil_cards_owned, foil_cards_total, opened_packs, last_card_name, last_updated)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
       ON CONFLICT(playername) DO UPDATE SET
         collection_score = COALESCE(?2, collection_score),
         unique_cards_owned = COALESCE(?3, unique_cards_owned),
         unique_cards_total = COALESCE(?4, unique_cards_total),
         foil_cards_owned = COALESCE(?5, foil_cards_owned),
         foil_cards_total = COALESCE(?6, foil_cards_total),
         opened_packs = COALESCE(?7, opened_packs),
         last_card_name = ?8,
         last_updated = ?9`
    )
      .bind(
        playername,
        extractCollectionScoreValue(content),
        extractUniqueCardOwnedCount(content),
        extractUniqueCardsTotal(content),
        extractTotalFoilCards(content),
        extractFoilCardsTotal(content),
        extractOpenedPacksValue(content),
        cardName,
        formatDate()
      )
      .run();
  } catch (error) {
    console.log(
      'recordTcgProgress ',
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Records TCG progress on every pull (unconditionally, even dupes/non-foils),
 * then notifies only when the card is new and either a foil or an accepted rarity.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} playerName
 * @param {string} content
 * @param {{ metadata: { cardName: string, rarityTier: string, newForCollection: boolean, foil: boolean, inspectUrl?: string } }} extra
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} URL
 * @returns {Promise<Map<{ ID: string, URL: string }, string>|undefined>}
 */
async function tcgHandler(
  msgMap,
  playerName,
  content,
  extra,
  WEEKLY_RECAP_DB,
  URL
) {
  const { cardName, rarityTier, newForCollection, foil, inspectUrl } =
    extra.metadata;

  await recordTcgProgress(WEEKLY_RECAP_DB, playerName, content, cardName);

  if (!newForCollection) return;
  if (!foil && !ACCEPTED_RARITIES.includes(rarityTier)) return;

  const cardProgress = extractCardProgress(content);
  const openedPacks = extractOpenedPacks(content);
  const collectionScore = extractCollectionScore(content) ?? '—';
  const foilProgress = extractFoilCardProgress(content) ?? '—';
  const foilOwnedCount = extractFoilOwnedCount(content);
  const uniqueCardOwnedCount = extractUniqueCardOwnedCount(content);
  const cardLabel = inspectUrl ? `[${cardName}](<${inspectUrl}>)` : cardName;

  const pullLine = buildPullLine({
    playerName,
    rarityTier,
    cardLabel,
    openedPacks,
    foil,
    foilOwnedCount,
    uniqueCardOwnedCount,
  });
  const statsLine = `-# Collection score: ${stripPercentage(collectionScore)} | Unique cards: ${stripPercentage(cardProgress)} | Unique Foils: ${stripPercentage(foilProgress)}`;
  const msg = `${pullLine}\n${statsLine}`;

  msgMap.set({ ID: EXTERNAL_PLUGIN, URL }, msg);

  return msgMap;
}

export default tcgHandler;
