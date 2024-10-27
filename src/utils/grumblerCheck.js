import * as Constants from '../constants.js';
/**
 * Always check for the grumbler
 * @param {*} name
 * @returns
 */
export default function grumblerCheck(name) {
  if (
    name.toUpperCase() === Constants.PHANTOM_MUSPAH ||
    name.toUpperCase() === Constants.MUPHIN
  ) {
    return Constants.THE_GRUMBLER;
  }
  return name;
}
