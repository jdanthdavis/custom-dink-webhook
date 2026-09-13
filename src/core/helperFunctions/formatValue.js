/**
 * Formats a value into shorthand, e.g. "(1.20B)", "(45.6M)", "(2.3K)".
 * `stripParens` strips the parens. Values >= 2,147,000,000 return "Very valuable!".
 * @param {number} value
 * @param {boolean} [stripParens]
 * @returns {string}
 */
function formatValue(value, stripParens = false) {
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

  return stripParens ? formatted.replace(/[()]/g, '') : formatted;
}

export default formatValue;
