/**
 * Generates a URL to fetch the thumbnail image based on the given thumbnail ID.
 *
 * @param {string} thumbnailId - The ID of the thumbnail to fetch.
 * @returns {string} The full URL to the thumbnail image.
 */
function getThumbnailUrl(thumbnailId) {
  return `https://static.runelite.net/cache/item/icon/${thumbnailId}.png`;
}
export default getThumbnailUrl;
