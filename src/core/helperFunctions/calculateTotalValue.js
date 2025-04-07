/**
 * Calculates the total value of a list of items based on their quantity and price.
 *
 * This function iterates through an array of items, each containing a `quantity` and `priceEach` property,
 * and returns the sum of the total values of all items.
 *
 * @param {Array<Object>} items - An array of item objects. Each item must have the properties:
 *   - `quantity` {number} - The quantity of the item.
 *   - `priceEach` {number} - The price of one unit of the item.
 * @returns {number} The total value calculated by summing the quantity multiplied by the price for each item.
 */
function calculateTotalValue(items) {
  return items.reduce((total, item) => {
    return total + item.quantity * item.priceEach;
  }, 0);
}

export default calculateTotalValue;
