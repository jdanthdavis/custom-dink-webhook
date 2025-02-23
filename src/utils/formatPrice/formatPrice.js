/**
 * Formats prices into shorthand prices
 * @param {*} value
 * @returns
 */
function formatPrice(value) {
  if (value >= 2147e6) return '**Very valuable**';
  if (value >= 1e9)
    return `**(${(value / 1e9).toFixed(2).replace(/\.00$/, '')}B)**`;
  if (value >= 1e6)
    return `**(${(value / 1e6).toFixed(2).replace(/\.00$/, '')}M)**`;
  if (value >= 1e3)
    return `**(${(value / 1e3).toFixed(1).replace(/\.0$/, '')}K)**`;
  return `**(${value})**`;
}

export default formatPrice;
