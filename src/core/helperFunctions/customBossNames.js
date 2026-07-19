import * as Constants from '../../constants';

/**
 * Always check for the grumbler
 * @param {string} name - The name of the boss
 * @returns {string} - The updated name
 */
function customBossNames(name) {
  const upperName = name.toUpperCase();

  if (upperName.includes(Constants.HALLOWED_SEPULCHRE.toUpperCase())) {
    return Constants.GRAND_HALLOWED_COFFIN;
  }

  const RENAME_MAP = {
    [Constants.PHANTOM_MUSPAH.toUpperCase()]: Constants.THE_GRUMBLER,
    [Constants.MUPHIN.toUpperCase()]: Constants.THE_GRUMBLER,
    [Constants.DUSK.toUpperCase()]: Constants.GG,
    [Constants.LUNAR_CHEST.toUpperCase()]: Constants.MOONS_OF_PERIL,
  };

  return RENAME_MAP[upperName] ?? name;
}

export default customBossNames;
