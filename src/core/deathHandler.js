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
];

const INVALID_FOOD_ARR = ['Shark lure'];

const GRUMBLER_REGION = 11330;

/**
 * Handles a player's death event and updates the message map with a formatted message.
 *
 * If the death was caused by PvP, includes the killer's name and value lost.
 * Otherwise, logs a simple death message.
 *
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The map to update with the death message.
 * @param {string} playerName - The name of the player who died.
 * @param {{ isPvp?: boolean, valueLost?: number, killerName?: string }} extra - Additional death information.
 * @param {string} URL - The associated URL for the death event.
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map.
 */
function deathHandler(msgMap, playerName, extra, URL) {
  const { isPvp, valueLost, killerName, keptItems, lostItems, regionId } =
    extra;
  const formattedValueLost = formatValue(valueLost);
  const randomIndex = Math.floor(Math.random() * DEATH_EMOJIS.length);
  const combinedFoods = [...keptItems, ...lostItems];
  let msg;

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
  }, {});

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
