import { formatValue, formatLists } from './helperFunctions';
import { DEATH_EMOJIS, DEATH } from '../constants';

const FOOD_ARR = [
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
  "Xeric's aid",
  'Nectar',
  'Ambrosia',
  'Honey locust',
  'Silk dressing',
  'Cooked bream',
  'Cooked moss lizard',
];

const INVALID_FOOD_ARR = ['Shark lure'];

const GRUMBLER_REGION = 11330;

/**
 * Upserts a player's death count and cumulative GP lost for the weekly recap.
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} playername
 * @param {number} valueLost
 */
async function recordDeath(WEEKLY_RECAP_DB, playername, valueLost) {
  try {
    await WEEKLY_RECAP_DB.prepare(
      `INSERT INTO deaths (playername, death_count, total_value_lost)
       VALUES (?1, 1, ?2)
       ON CONFLICT(playername) DO UPDATE SET
         death_count = death_count + 1,
         total_value_lost = total_value_lost + ?2`
    )
      .bind(playername, valueLost)
      .run();
  } catch (error) {
    console.log('recordDeath ', error instanceof Error ? error.message : error);
  }
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
    const matched = FOOD_ARR.find(
      (kw) =>
        item.name.toLowerCase().startsWith(kw.toLowerCase()) &&
        !INVALID_FOOD_ARR.includes(item.name)
    );
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
