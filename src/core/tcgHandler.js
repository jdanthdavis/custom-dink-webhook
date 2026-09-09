import { EXTERNAL_PLUGIN } from "../constants";
import { formatAsPercentage, formatDate, formatLeaderboardTable } from "./helperFunctions";

const ACCEPTED_RARITIES = ["Mythic", "Godly", "Legendary"];
const FOIL_MILESTONE_INTERVAL = 50;
const CARD_MILESTONE_INTERVAL = 250;

/**
 * Extracts the total number of cards the game has from the content string and
 * pairs it with the "Total cards" count.
 * @param {string} content - The raw content from the TCG message
 * @returns {string|null} A formatted string in the format "owned/total (percentage%)", or null if data is missing
 */
function extractCardProgress(content) {
  const gameTotalMatch = content?.match(
    /Unique cards: [\d ]+ \/ ([\d ]+) \([\d.]+%\)/,
  );
  if (!gameTotalMatch) return null;

  const totalCardsMatch = content?.match(/Total cards: ([\d ]+)/);
  if (!totalCardsMatch) return null;

  const gameTotal = Number(gameTotalMatch[1].replace(/ /g, ""));
  const totalCards = Number(totalCardsMatch[1].replace(/ /g, ""));

  const formattedOwned = totalCards.toLocaleString("en-US");
  const formattedTotal = gameTotal.toLocaleString("en-US");
  const percentage = ((totalCards / gameTotal) * 100).toFixed(1);

  return `${formattedOwned}/${formattedTotal} (${percentage}%)`;
}

/**
 * Extracts the "Opened packs" count from the raw content string.
 * @param {string} content - The raw content from the TCG message
 * @returns {string|null} The opened packs count formatted with thousands separators, or null if not found
 */
function extractOpenedPacks(content) {
  const match = content?.match(/Opened packs: ([\d ]+)/);
  return match
    ? Number(match[1].replace(/ /g, "")).toLocaleString("en-US")
    : null;
}

/**
 * Extracts the unique-foil-card progress (owned/total and percentage) from
 * the raw content string.
 * @param {string} content - The raw content from the TCG message
 * @returns {string|null} A formatted string in the format "owned/total (percentage%)", or null if data is missing
 */
function extractFoilCardProgress(content) {
  const match = content?.match(
    /Unique foil cards: ([\d ]+) \/ ([\d ]+) \(([\d.]+)%\)/,
  );
  if (!match) return null;

  const owned = Number(match[1].replace(/ /g, "")).toLocaleString("en-US");
  const total = Number(match[2].replace(/ /g, "")).toLocaleString("en-US");

  return `${owned}/${total} (${match[3]}%)`;
}

/**
 * Extracts the raw (unformatted) unique-foil-cards-owned count from the raw
 * content string, used to check for interval milestones.
 * @param {string} content - The raw content from the TCG message
 * @returns {number|null} The number of unique foil cards owned, or null if not found
 */
function extractFoilOwnedCount(content) {
  const match = content?.match(/Unique foil cards: ([\d ]+) \/ [\d ]+ \(/);
  return match ? Number(match[1].replace(/ /g, "")) : null;
}

/**
 * Extracts the raw (unformatted) unique-cards-owned count from the raw
 * content string, used to check for interval milestones.
 *
 * Despite the name, this reads the "Total cards" line (every pull, dupes
 * included), not the true-distinct "Unique cards" figure - matching the
 * message display's existing convention. Also reused for D1 tracking, where
 * dupes are meant to count toward the weekly recap.
 * @param {string} content - The raw content from the TCG message
 * @returns {number|null} The number of cards owned (dupes included), or null if not found
 */
function extractUniqueCardOwnedCount(content) {
  const match = content?.match(/Total cards: ([\d ]+)/);
  return match ? Number(match[1].replace(/ /g, "")) : null;
}

/**
 * Extracts the collection score and its percentage from the raw content string.
 * @param {string} content - The raw content from the TCG message
 * @returns {string|null} A formatted string in the format "score (percentage%)", or null if not found
 */
function extractCollectionScore(content) {
  const match = content?.match(/Collection score: ([\d ]+) \(([\d.]+)%\)/);
  if (!match) return null;

  const score = Number(match[1].replace(/ /g, "")).toLocaleString("en-US");
  return `${score} (${match[2]}%)`;
}

/**
 * Extracts the raw (unformatted) collection score from the raw content
 * string, used for D1 tracking.
 * @param {string} content - The raw content from the TCG message
 * @returns {number|null}
 */
function extractCollectionScoreValue(content) {
  const match = content?.match(/Collection score: ([\d ]+) \(/);
  return match ? Number(match[1].replace(/ /g, "")) : null;
}

/**
 * Extracts the raw "Total foil cards" count (every foil pull, dupes
 * included) from the raw content string, used for D1 tracking. This field
 * isn't used by any of the display logic above - dupes count toward the
 * weekly recap even though the pull message itself only ever shows the
 * true-distinct "Unique foil cards" figure.
 * @param {string} content - The raw content from the TCG message
 * @returns {number|null}
 */
function extractTotalFoilCards(content) {
  const match = content?.match(/Total foil cards: ([\d ]+)/);
  return match ? Number(match[1].replace(/ /g, "")) : null;
}

/**
 * Extracts the game's total possible unique cards (the denominator of the
 * "Unique cards: X / Y" line), used for D1 tracking.
 * @param {string} content - The raw content from the TCG message
 * @returns {number|null}
 */
function extractUniqueCardsTotal(content) {
  const match = content?.match(/Unique cards: [\d ]+ \/ ([\d ]+) \(/);
  return match ? Number(match[1].replace(/ /g, "")) : null;
}

/**
 * Extracts the game's total possible unique foil cards (the denominator of
 * the "Unique foil cards: X / Y" line), used for D1 tracking.
 * @param {string} content - The raw content from the TCG message
 * @returns {number|null}
 */
function extractFoilCardsTotal(content) {
  const match = content?.match(/Unique foil cards: [\d ]+ \/ ([\d ]+) \(/);
  return match ? Number(match[1].replace(/ /g, "")) : null;
}

/**
 * Extracts the raw (unformatted) opened-packs count from the raw content
 * string, used for D1 tracking.
 * @param {string} content - The raw content from the TCG message
 * @returns {number|null}
 */
function extractOpenedPacksValue(content) {
  const match = content?.match(/Opened packs: ([\d ]+)/);
  return match ? Number(match[1].replace(/ /g, "")) : null;
}

/**
 * Strips a trailing " (X%)" suffix from a formatted stat string, e.g.
 * "215/5,173 (4.2%)" -> "215/5,173". Leaves a string without that suffix
 * (like the "—" fallback) unchanged, and passes through null/undefined as-is.
 * @param {string|null|undefined} stat
 * @returns {string|null|undefined}
 */
function stripPercentage(stat) {
  return stat?.replace(/ \([\d.]+%\)$/, "") ?? stat;
}

/**
 * Checks whether an owned count lands exactly on a milestone interval, e.g.
 * isMilestone(100, 50) -> true.
 * @param {number|null} count - The owned count, or null if unknown
 * @param {number} interval - The milestone interval (e.g. every 50)
 * @returns {boolean}
 */
function isMilestone(count, interval) {
  return count !== null && count % interval === 0;
}

/**
 * Builds the pull-line message for a qualifying card pull. Uses a distinct
 * milestone message when the foil or unique-card owned count lands exactly
 * on its interval (FOIL_MILESTONE_INTERVAL / CARD_MILESTONE_INTERVAL),
 * otherwise falls back to the standard pull message.
 * @param {object} params
 * @param {string} params.playerName - The player's name
 * @param {string} params.rarityTier - The card's rarity tier
 * @param {string} params.cardLabel - The card name, optionally linked
 * @param {string|null} params.openedPacks - The formatted opened-packs count
 * @param {boolean} params.foil - Whether the pulled card is a foil
 * @param {number|null} params.foilOwnedCount - Raw unique-foil-cards-owned count
 * @param {number|null} params.uniqueCardOwnedCount - Raw unique-cards-owned count
 * @returns {string} The formatted pull-line message
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
  const foilTag = " :sparkles: *foil* :sparkles:";
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
 * Upserts a player's TCG progress snapshot for the weekly recap. Every
 * column reflects cumulative state as of this pull, dupes included (a
 * duplicate foil/card pull still moves these numbers) - missing stats (a
 * field absent from `content`) are preserved via COALESCE rather than
 * overwritten with null.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @param {string} playername
 * @param {string} content - The raw content from the TCG message
 * @param {string} cardName
 */
async function recordTcgProgress(WEEKLY_RECAP_DB, playername, content, cardName) {
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
 * Fetches and formats the full TCG leaderboard as a titled table, or null if
 * no player has any tracked progress. Recap-only by design - there's no
 * chat command exposing this on demand.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @returns {Promise<string|null>}
 */
export async function getTcgLeaderboard(WEEKLY_RECAP_DB) {
  /** @type {Array<{ playername: string, collection_score?: number, unique_cards_owned?: number, unique_cards_total?: number, foil_cards_owned?: number, foil_cards_total?: number }>|null} */
  let rows;
  try {
    const { results } = await WEEKLY_RECAP_DB.prepare(
      'SELECT playername, collection_score, unique_cards_owned, unique_cards_total, foil_cards_owned, foil_cards_total FROM tcg_progress'
    ).all();
    rows = results;
  } catch (error) {
    console.log('getTcgLeaderboard error:', error instanceof Error ? error.message : error);
    return null;
  }

  if (!rows || rows.length === 0) return null;

  const sorted = [...rows].sort(
    (a, b) => (Number(b.collection_score) || 0) - (Number(a.collection_score) || 0)
  );

  /** @param {number|null|undefined} owned @param {number|null|undefined} total */
  const formatRatio = (owned, total) =>
    total != null
      ? `${owned ?? 0}/${total} (${formatAsPercentage(Number(owned) || 0, total)}%)`
      : String(owned ?? '-');

  const headers = ['Name', 'Score', 'Cards Pulled', 'Foils Pulled'];
  const tableRows = sorted.map((row) => [
    row.playername,
    String(Number(row.collection_score) || '-'),
    formatRatio(row.unique_cards_owned, row.unique_cards_total),
    formatRatio(row.foil_cards_owned, row.foil_cards_total),
  ]);

  return formatLeaderboardTable('TCG Board', headers, tableRows);
}

/**
 * Creates a TCG pull notification message when a qualifying card is found,
 * and records the player's updated progress for the weekly recap.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {string} content - The raw content string containing card collection progress
 * @param {{ metadata: { cardName: string, rarityTier: string, newForCollection: boolean, foil: boolean, inspectUrl?: string } }} extra - Additional information about the card pull
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @param {string} URL - The associated URL
 * @returns {Promise<Map<{ ID: string, URL: string }, string>|undefined>} The updated message map, or undefined if the pull doesn't qualify for a notification
 */
async function tcgHandler(msgMap, playerName, content, extra, WEEKLY_RECAP_DB, URL) {
  const { cardName, rarityTier, newForCollection, foil, inspectUrl } =
    extra.metadata;

  if (!newForCollection) return;
  if (!foil && !ACCEPTED_RARITIES.includes(rarityTier)) return;

  const cardProgress = extractCardProgress(content);
  const openedPacks = extractOpenedPacks(content);
  const collectionScore = extractCollectionScore(content) ?? "—";
  const foilProgress = extractFoilCardProgress(content) ?? "—";
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

  await recordTcgProgress(WEEKLY_RECAP_DB, playerName, content, cardName);

  return msgMap;
}

export default tcgHandler;
