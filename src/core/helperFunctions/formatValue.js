/**
 * Formats prices into shorthand prices, e.g., converting large numbers to
 * more readable formats like millions (M), billions (B), or thousands (K).
 *
 * If the value is 1 billion or more, it's formatted as `(X.XXB)`.
 * If the value is 1 million or more but less than 1 billion, it's formatted as `(X.XXM)`.
 * If the value is 1 thousand or more but less than 1 million, it's formatted as `(X.XK)`.
 * If the value is 2,147,000,000 or more, it's labeled as "Very valuable".
 * If none of the above conditions are met, the original value is returned.
 *
 * @param {number} value - The numeric value to be formatted.
 * @returns {string} - The formatted price as a string, or 'Very valuable' for extremely large values.
 */
function formatValue(value, xpInterval = false) {
  if (value >= 2147e6) return 'Very valuable!';

  let formatted;
  if (value >= 1e9) {
    formatted = `(${(value / 1e9).toFixed(2).replace(/\.00$/, '')}B)`;
  } else if (value >= 1e6) {
    formatted = `(${(value / 1e6).toFixed(2).replace(/\.00$/, '')}M)`;
  } else if (value >= 1e3) {
    formatted = `(${(value / 1e3).toFixed(1).replace(/\.0$/, '')}K)`;
  } else {
    formatted = `(${value})`;
  }

  return xpInterval ? formatted.replace(/[()]/g, '') : formatted;
}

export default formatValue;
