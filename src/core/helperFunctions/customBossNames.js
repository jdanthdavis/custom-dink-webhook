import * as Constants from '../../constants';

/**
 * Renames a boss to its custom display name (e.g. Phantom Muspah -> The Grumbler).
 * @param {string} name
 * @returns {string}
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
