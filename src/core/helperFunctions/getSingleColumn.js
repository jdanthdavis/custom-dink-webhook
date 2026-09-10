/**
 * Looks up a single numeric column for one player from a D1 table.
 * @param {*} DB
 * @param {string} table
 * @param {string} column
 * @param {string} playername
 * @param {string} [errorLabel] - defaults to "<table>.<column>"
 * @returns {Promise<number|null>}
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
