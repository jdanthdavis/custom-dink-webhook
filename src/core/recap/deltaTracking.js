/**
 * Fetches rows from a D1 table, computes each row's change on one or more
 * numeric columns since their last-recorded baseline, drops rows with no
 * change across every tracked metric, and resets every changed baseline to
 * the current value as a side effect - so the next call's deltas are
 * measured from here.
 *
 * A missing baseline (NULL) counts as 0, so a brand-new row's first
 * appearance has its full current value counted as "gained." The reset
 * UPDATE only rewrites rows that actually changed (`baseline IS NOT
 * current`), so an unchanged player's row isn't re-written every cycle for
 * nothing.
 *
 * Shared by every weekly-recap section that reports a change-since-last-time
 * rather than a running total (pets, TCG, and future domains built the same
 * way) - extracted because the fetch/diff/reset/shape was being hand-copied
 * per domain.
 *
 * Only call this once per recap cycle. Calling it outside that context would
 * zero out real, unreported progress.
 *
 * @param {*} DB - D1 database binding
 * @param {object} options
 * @param {string} options.table - The table to query
 * @param {Array<{ current: string, baseline: string, key: string }>} options.metrics -
 *   Column pairs to diff. Each produces a `<key>Delta` field on the result rows.
 * @param {string[]} [options.extraColumns] - Additional non-metric columns to carry through as-is (e.g. a display name).
 * @returns {Promise<Array<{ playername: string, [field: string]: any }>|null>} Rows with a nonzero delta on at least one metric, or null if the table's empty or the query fails.
 */
export async function computeAndResetDeltas(
  DB,
  { table, metrics, extraColumns = [] }
) {
  const columns = [
    'playername',
    ...extraColumns,
    ...metrics.flatMap(({ current, baseline }) => [current, baseline]),
  ];

  /** @type {any[]|null} */
  let rows;
  try {
    const { results } = await DB.prepare(
      `SELECT ${columns.join(', ')} FROM ${table}`
    ).all();
    rows = results;
  } catch (error) {
    console.log(
      `computeAndResetDeltas(${table}) error:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }

  if (!rows || rows.length === 0) return null;

  const changes = rows
    .map((row) => {
      /** @type {Record<string, any>} */
      const result = { playername: row.playername };
      for (const col of extraColumns) result[col] = row[col];
      for (const { current, baseline, key } of metrics) {
        result[`${key}Delta`] =
          (Number(row[current]) || 0) - (Number(row[baseline]) || 0);
      }
      return result;
    })
    .filter((row) => metrics.some(({ key }) => row[`${key}Delta`] !== 0));

  // Reset baselines to current values regardless of what was reported above,
  // so next time's deltas are measured from this point on - but only touch
  // rows that actually changed (SQLite's IS NOT is null-safe, so a brand-new
  // row with a NULL baseline still counts as "changed" and gets reset).
  const changedCondition = metrics
    .map(({ current, baseline }) => `${baseline} IS NOT ${current}`)
    .join(' OR ');
  const resetAssignments = metrics
    .map(({ current, baseline }) => `${baseline} = ${current}`)
    .join(', ');
  try {
    await DB.prepare(
      `UPDATE ${table} SET ${resetAssignments} WHERE ${changedCondition}`
    ).run();
  } catch (error) {
    console.log(
      `computeAndResetDeltas(${table}) reset error:`,
      error instanceof Error ? error.message : error
    );
  }

  return changes;
}
