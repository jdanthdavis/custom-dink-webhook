/**
 * Format a number by inserting commas as thousand separators.
 * Accepts a number or a numeric string. Returns a formatted string,
 * or 'Invalid input' if the input cannot be converted to a number.
 *
 * @param {number|string} input - The number or numeric string to format
 * @returns {string} The formatted number with commas, or 'Invalid input' for invalid inputs
 */
const addCommas = (input) => {
  const number = Number(input);

  if (isNaN(number)) {
    return 'Invalid input';
  }

  return number.toLocaleString();
};

export default addCommas;
