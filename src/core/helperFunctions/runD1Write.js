import retryOnce from './retryOnce';
import escapeSqlString from './escapeSqlString';

/**
 * Renders one bind value as a SQL literal, for a copy-pasteable fix-it
 * statement - never for a real query, which must always use bound params.
 * @param {any} value
 * @returns {string}
 */
function renderSqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${escapeSqlString(String(value))}'`;
}

/**
 * Substitutes each `?N` (numbered) or `?` (positional) placeholder in `sql`
 * with its literal bind value, producing a copy-pasteable fix-it statement.
 * @param {string} sql
 * @param {any[]} values
 * @returns {string}
 */
function renderFixSql(sql, values) {
  let positionalIndex = 0;
  return sql.replace(/\?(\d+)?/g, (_, n) => {
    const index = n ? Number(n) - 1 : positionalIndex++;
    return renderSqlLiteral(values[index]);
  });
}

/**
 * Runs a D1 write, retrying once on a transient failure. If it still fails,
 * logs a ready-to-run fix-it SQL statement - `sql` with every placeholder
 * substituted for its literal value - so a lost write is a copy/paste away
 * from fixed instead of silently lost data. Never rejects.
 * @param {*} DB
 * @param {object} params
 * @param {string} params.label - calling function's name, for the log prefix
 * @param {string} params.sql - parameterized SQL, using `?N` or `?` placeholders
 * @param {any[]} params.values - bind values, in placeholder order
 * @param {string} [params.note] - optional extra context appended to the failure log
 * @returns {Promise<void>}
 */
async function runD1Write(DB, { label, sql, values, note }) {
  try {
    await retryOnce(() =>
      DB.prepare(sql)
        .bind(...values)
        .run()
    );
  } catch (error) {
    console.log(
      `${label} FAILED after retry - D1 was NOT updated. To fix manually, run: ${renderFixSql(sql, values)}${note ? ` (${note})` : ''}`,
      error instanceof Error ? error.message : error
    );
  }
}

export default runD1Write;
