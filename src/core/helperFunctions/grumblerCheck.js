import * as Constants from './../../constants';

/**
 * Always check for the grumbler
 * @param {string} name - The name of the boss
 * @returns {string} - The updated name
 */
function grumblerCheck(name) {
  const upperName = name.toUpperCase();

  switch (true) {
    case upperName === Constants.PHANTOM_MUSPAH:
    case upperName === Constants.MUPHIN:
      return Constants.THE_GRUMBLER;

    case upperName.includes(Constants.HALLOWED_SEPULCHRE.toUpperCase()):
      return Constants.GRAND_HALLOWED_COFFIN;

    case upperName === Constants.DUSK:
      return Constants.GG;

    default:
      return name;
  }
}

export default grumblerCheck;
