import * as Constants from '../../constants';

/**
 * Always check for the grumbler
 * @param {*} name
 * @returns
 */
function GrumblerCheck(name) {
  const upperName = name.toUpperCase();
  if (
    upperName === Constants.PHANTOM_MUSPAH ||
    upperName === Constants.MUPHIN
  ) {
    return Constants.THE_GRUMBLER;
  }
  return name;
}

export default GrumblerCheck;
