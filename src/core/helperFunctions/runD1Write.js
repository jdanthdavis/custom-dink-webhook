import retryOnce from './retryOnce';

/**
 * Runs a D1 write via retryOnce; if it still fails after the retry, logs a
 * ready-to-run fix-it SQL statement (built lazily, only on failure) instead
 * of a bare error - so a lost write is a copy/paste away from fixed rather
 * than silently lost data. Never rejects, so callers don't need their own
 * try/catch.
 * @param {() => Promise<any>} fn - the D1 write, already .bind()'d
 * @param {object} context
 * @param {string} context.label - the calling function's name, for the log prefix
 * @param {() => string} context.buildFixSql - lazily builds the fix-it SQL; called only on failure
 * @returns {Promise<void>}
 */
async function runD1Write(fn, { label, buildFixSql }) {
  try {
    await retryOnce(fn);
  } catch (error) {
    console.log(
      `${label} FAILED after retry - D1 was NOT updated. To fix manually, run: ${buildFixSql()}`,
      error instanceof Error ? error.message : error
    );
  }
}

export default runD1Write;
