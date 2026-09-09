/**
 * Formats today's date as MM/DD/YYYY, matching the date strings already stored
 * alongside pet/loot D1 records.
 * @returns {string}
 */
function formatDate() {
  const today = new Date();
  return `${String(today.getMonth() + 1).padStart(2, '0')}/${String(
    today.getDate()
  ).padStart(2, '0')}/${today.getFullYear()}`;
}

export default formatDate;
