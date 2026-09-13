/**
 * Runs an async function, retrying once more on failure before giving up -
 * cheap insurance against a transient D1 write error silently losing data.
 * Safe to use on an idempotent write (e.g. a single atomic UPSERT); the
 * caller's own try/catch still handles a failure on the second attempt.
 * @param {() => Promise<any>} fn
 * @returns {Promise<any>}
 */
async function retryOnce(fn) {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}

export default retryOnce;
