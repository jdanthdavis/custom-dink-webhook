import * as Constants from '../../Constants';

/**
 * Always check for the grumbler
 * @param {string} name - The name of the boss
 * @returns {string} - The updated name
 */
function grumblerCheck(name) {
  const upperName = name.toUpperCase();
  if (
    upperName === Constants.PHANTOM_MUSPAH ||
    upperName === Constants.MUPHIN
  ) {
    return Constants.THE_GRUMBLER;
  }
  return name;
}

export default grumblerCheck;
