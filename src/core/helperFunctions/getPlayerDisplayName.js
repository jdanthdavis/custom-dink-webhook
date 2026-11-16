import { PLAYER_DISPLAY_NAMES } from '../../constants';

/**
 * The name to show for a player on a recap board. D1 stores whatever casing
 * the row was first written with (and the Hiscores poll queries uppercase),
 * so look the name up case-insensitively in PLAYER_DISPLAY_NAMES, falling
 * back to the stored name for anyone not listed there.
 * @param {string} playername
 * @returns {string}
 */
function getPlayerDisplayName(playername) {
  return PLAYER_DISPLAY_NAMES[playername.toUpperCase()] ?? playername;
}

export default getPlayerDisplayName;
