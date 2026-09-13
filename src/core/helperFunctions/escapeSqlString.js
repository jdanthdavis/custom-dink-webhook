/**
 * Escapes a single-quoted SQL string literal (doubles each `'`), for
 * building copy-pasteable fix-it SQL in a failure log - not for building
 * real queries, which should always use bound parameters instead.
 * @param {string} value
 * @returns {string}
 */
function escapeSqlString(value) {
  return value.replace(/'/g, "''");
}

export default escapeSqlString;
