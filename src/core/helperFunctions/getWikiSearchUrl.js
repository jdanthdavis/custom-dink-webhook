/**
 * Generates a URL for the OSRS wiki search page based on the provided search term.
 * Encodes the search term to ensure it is URL safe.
 *
 * @param {string} searchTerm - The term to search for on the OSRS wiki.
 * @returns {string|null} The full URL to the search page, or null if the search term is falsy.
 */
function getWikiSearchUrl(searchTerm) {
  return searchTerm
    ? `https://oldschool.runescape.wiki/w/Special:Search?search=${encodeURIComponent(
        searchTerm
      )}`
    : null;
}

export default getWikiSearchUrl;
