/**
 * Formats a percentage depending on its length
 * @param {*} percentage
 * @returns {string} - The formatted percentage
 */
function FormatAsPercentage(percentage) {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return 'Invalid percentage';
  }

  const percentSize = percentage.toString().split('.')[0];

  if (percentSize?.length === 1) {
    return percentage.toFixed(2); // Ensures two decimal places for small percentages
  } else if (percentSize?.length === 2 || percentSize?.length === 3) {
    return percentage.toFixed(1); // One decimal place for percentages up to 100%
  }

  return '100%';
}

export default FormatAsPercentage;
