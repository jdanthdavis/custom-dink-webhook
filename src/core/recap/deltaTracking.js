/**
 * Fetches rows from a D1 table, diffs one or more columns against their
 * baseline (NULL counts as 0), drops rows with no change, and resets every
 * changed baseline to the current value. Shared by every weekly-recap
 * section that reports a change since last time rather than a running
 * total. Only call once per recap cycle - it consumes the baseline.
 * @param {*} DB
 * @param {object} options
 * @param {string} options.table
 * @param {Array<{ current: string, baseline: string, key: string }>} options.metrics - column pairs to diff; each produces a `<key>Delta` field
 * @param {string[]} [options.extraColumns] - non-metric columns to carry through as-is
 * @returns {Promise<Array<{ playername: string, [field: string]: any }>|null>}
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
