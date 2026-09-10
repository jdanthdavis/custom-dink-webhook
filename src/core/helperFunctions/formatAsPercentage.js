/**
 * Formats value/total as a percentage (2 decimals under 10%, 1 up to 100%,
 * capped at "100%"; "Invalid percentage" for bad input).
 * @param {number} value
 * @param {number} total
 * @returns {string}
 */
const formatAsPercentage = (value, total) => {
  if (
    typeof value !== 'number' ||
    isNaN(value) ||
    typeof total !== 'number' ||
    isNaN(total) ||
    total <= 0
  ) {
    return 'Invalid percentage';
  }

  const percentage = (value / total) * 100;

  if (percentage > 100) {
    return '100%';
  }

  const percentSize = percentage.toString().split('.')[0];

  if (percentSize?.length === 1) {
    return percentage.toFixed(2); // Two decimal places for small percentages
  } else if (percentSize?.length === 2 || percentSize?.length === 3) {
    return percentage.toFixed(1); // One decimal place for percentages up to 100%
  }

  return percentage.toFixed(0); // No decimal places for exact percentages
};

export default formatAsPercentage;
