/**
 * Looks up a single numeric column for one player from a D1 table.
 * @param {*} DB - D1 database binding
 * @param {string} table - The table to query
 * @param {string} column - The column to select
 * @param {string} playername - The player to look up
 * @param {string} [errorLabel] - Label prefixed to a logged error; defaults to "<table>.<column>"
 * @returns {Promise<number|null>} The column's value, or null if the row/value is missing or the query fails
 */
async function getSingleColumn(DB, table, column, playername, errorLabel) {
  try {
    const row = await DB.prepare(
      `SELECT ${column} FROM ${table} WHERE playername = ?`
    )
      .bind(playername)
      .first();
    return row?.[column] != null ? Number(row[column]) : null;
  } catch (error) {
    console.log(
      `${errorLabel ?? `${table}.${column}`} `,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

export default getSingleColumn;
