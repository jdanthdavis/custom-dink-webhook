/**
 * Calculates the percentage based on value and total, then formats it.
 *
 * If the percentage is less than 10, it will be formatted with 2 decimal places.
 * If the percentage is between 10 and 100, it will be formatted with 1 decimal place.
 * If the percentage is greater than 100, it will return `'100%'`.
 * If the input is not valid, it will return `'Invalid percentage'`.
 *
 * @param {number} value - The numerator (part of the total).
 * @param {number} total - The denominator (the total value).
 * @returns {string} - The formatted percentage as a string.
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
