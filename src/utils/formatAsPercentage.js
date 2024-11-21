/**
 * Formats a percentage depending on its length
 * @param {*} percentage
 * @returns
 */
function formatAsPercentage(percentage) {
  const percentSize = percentage.toString().split('.')[0];

  if (percentSize?.length === 1) {
    return percentage.toString().slice(0, 4);
  } else if (percentSize?.length === 2 || percentSize?.length === 3) {
    return percentage.toString().slice(0, 5);
  }
}

export default formatAsPercentage;
