import * as Constants from "../constants.js";

/**
 * Always check for the grumbler
 * @param {*} name
 * @returns
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
