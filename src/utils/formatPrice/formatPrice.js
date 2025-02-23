/**
 * Formats prices into shorthand prices
 * @param {*} value
 * @returns
 */
function formatPrice(value) {
  if (value >= 2_147_000_000) return '**Very valuable**';
  if (value >= 1_000_000_000)
    return `**${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B**`;
  if (value >= 1_000_000)
    return `**${(value / 1_000_000).toFixed(2).replace(/\.00$/, '')}M**`;
  if (value >= 1_000)
    return `**${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K**`;
  return `**(${value})**`;
}

export default formatPrice;
