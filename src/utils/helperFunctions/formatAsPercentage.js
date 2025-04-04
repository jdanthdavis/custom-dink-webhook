/**
 * Formats a percentage depending on its length.
 *
 * If the percentage is less than 10, it will be formatted with 2 decimal places.
 * If the percentage is between 10 and 100, it will be formatted with 1 decimal place.
 * If the percentage is greater than 100, it will return `'100%'`.
 * If the input is not a valid number, it will return `'Invalid percentage'`.
 *
 * @param {number} percentage - The percentage to be formatted.
 * @returns {string} - The formatted percentage as a string.
 */
function formatAsPercentage(percentage) {
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

export default formatAsPercentage;
