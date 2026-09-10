const PB_TIME_REGEX = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/;

/**
 * Formats an ISO-8601 PB duration (e.g. "PT1M30.5S") into display text (e.g. "1:30.5").
 * @param {string} time
 * @returns {string | null} null if unparseable
 */
function formatPbTime(time) {
  const match = typeof time === 'string' ? time.match(PB_TIME_REGEX) : null;
  const [, hoursStr, minutesStr, secondsStr] = match || [];

  if (!match || (!hoursStr && !minutesStr && !secondsStr)) {
    return null;
  }

  // Seconds-only PB (no minutes, no hours) keeps the "30s" / "5.2s" form
  if (!hoursStr && !minutesStr) {
    return `${secondsStr}s`;
  }

  const padSeconds = (str) => {
    const [whole, decimal] = (str ?? '0').split('.');
    const paddedWhole = whole.padStart(2, '0');
    return decimal !== undefined ? `${paddedWhole}.${decimal}` : paddedWhole;
  };

  const minutes = Number(minutesStr ?? 0);

  if (hoursStr) {
    return `${Number(hoursStr)}:${String(minutes).padStart(2, '0')}:${padSeconds(secondsStr)}`;
  }

  return `${minutes}:${padSeconds(secondsStr)}`;
}

export default formatPbTime;
