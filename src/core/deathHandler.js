import { formatValue, formatLists, runD1Write } from './helperFunctions';
import { DEATH } from '../constants';

const DEATH_EMOJIS = [
  '<:giggle:1024050755017130016>',
  '<:bozo:1364661207960780800>',
  '<a:itswill_bozo:1365315318318366770>',
  '<:sludge:1387592695341387938> ',
  '<:pick_ass:1535385109685870703> ',
];

const FOOD_NAMES = [
  'Shark',
  'Anglerfish',
  'Peach',
  'Jug of wine',
  'Cake',
  'Lobster',
  'Plain pizza',
  'Swordfish',
  'Snowy knight',
  'Monkfish',
  'Cooked karambwan',
  'Guthix rest',
  'Sea turtle',
  'Cooked sunlight antelope',
  'Pineapple pizza',
  'Summer pie',
  'Manta ray',
  'Tuna potato',
  'Dark crab',
  'Cooked dashing kebbit',
  'Cooked moonlight antelope',
  'Saradomin brew',
  'Blighted karambwan',
  'Blighted manta ray',
  'Blighted anglerfish',
  'Crystal paddlefish',
  'Corrupted paddlefish',
  'Paddlefish',
  "Xeric's aid",
  'Nectar',
  'Ambrosia',
  'Honey locust',
  'Silk dressing',
  'Cooked bream',
  'Cooked moss lizard',
  'Marlin',
  'Bluefin',
  'Halibut',
  'Yellowfin',
  'Haddock',
  'Giant krill',
  'Tuna',
  'Potato with cheese',
];

const FOOD_LOOKUP = new Map(
  FOOD_NAMES.map((name) => [name.toLowerCase(), name])
);

// Potion-style doses (e.g. "Saradomin brew(4)") still need to match their
// base name; stripping the suffix before an exact match handles that without
// a startsWith scan, so unrelated items like "Shark lure" can't false-match
// "Shark" and don't need an exclusion list.
const DOSE_SUFFIX = /\(\d\)$/;

/**
 * Matches an inventory item name to its canonical food name, if any.
 * @param {string} itemName
 * @returns {string | undefined}
 */
function matchFood(itemName) {
  const key = itemName.toLowerCase().replace(DOSE_SUFFIX, '');
  return FOOD_LOOKUP.get(key);
}

const GRUMBLER_REGION = 11330;

/**
 * Upserts a player's death count and cumulative GP lost for the weekly recap.
 * Retries once on a transient D1 failure - the write is a single atomic
 * UPSERT, so a retry can't double-count a death.
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} playername
 * @param {number} valueLost
 */
async function recordDeath(WEEKLY_RECAP_DB, playername, valueLost) {
  await runD1Write(WEEKLY_RECAP_DB, {
    label: 'recordDeath',
    sql: `INSERT INTO deaths (playername, death_count, total_value_lost)
          VALUES (?1, 1, ?2)
          ON CONFLICT(playername) DO UPDATE SET
            death_count = death_count + 1,
            total_value_lost = total_value_lost + ?2`,
    values: [playername, valueLost],
  });
}

/**
 * Records a player's death for the weekly recap and formats the notification.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} playerName
 * @param {{ isPvp?: boolean, valueLost?: number, killerName?: string, keptItems?: Array<{ name: string, quantity: number }>, lostItems?: Array<{ name: string, quantity: number }>, location?: { regionId?: number } }} extra
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} URL
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>}
 */
async function deathHandler(msgMap, playerName, extra, WEEKLY_RECAP_DB, URL) {
  const {
    isPvp,
    valueLost,
    killerName,
    keptItems = [],
    lostItems = [],
    location,
  } = extra;
  const regionId = location?.regionId;

  await recordDeath(WEEKLY_RECAP_DB, playerName, valueLost ?? 0);

  const formattedValueLost = formatValue(valueLost ?? 0);
  const randomIndex = Math.floor(Math.random() * DEATH_EMOJIS.length);
  const combinedFoods = [...keptItems, ...lostItems];
  let msg;

  /** @type {Record<string, number>} */
  const emptyFoodCount = {};
  const countFood = combinedFoods.reduce((acc, item) => {
    const matched = matchFood(item.name);
    if (matched) {
      acc[matched] = (acc[matched] || 0) + item.quantity;
    }
    return acc;
  }, emptyFoodCount);

  const foodLostString = formatLists(
    Object.entries(countFood)
      .sort((a, b) => b[1] - a[1])
      .map(([name, qty]) => `${qty}x ${name}`)
  );

  const lostFood = Boolean(foodLostString);

  if (regionId === GRUMBLER_REGION) {
    msg = `**${playerName}** has been grumbled ${DEATH_EMOJIS[randomIndex]}${
      lostFood ? `\n-# ${foodLostString}` : ''
    }`;
  } else {
    msg = isPvp
      ? `**${playerName}** has just been killed by **${killerName}** for **${formattedValueLost}** coins ${DEATH_EMOJIS[randomIndex]}`
      : `**${playerName}** has died ${DEATH_EMOJIS[randomIndex]}${
          lostFood ? `\n-# ${foodLostString}` : ''
        }`;
  }

  msgMap.set({ ID: DEATH, URL }, msg);

  return msgMap;
}

export default deathHandler;
