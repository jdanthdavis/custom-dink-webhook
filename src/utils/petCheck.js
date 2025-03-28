import grumblerCheck from "./grumblerCheck.js";

/**
 * Gathers the pet information
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 */
function petCheck(msgMap, playerName, extra, URL) {
  const { milestone, duplicate: isDuplicate, petName } = extra;
  const validatedPetName = grumblerCheck(petName);

  // Fallback for when the game message does not contain the pet's name or the milestone it was acquired at.
  if (!validatedPetName || !milestone) {
    const fallbackMsg = isDuplicate
      ? `**${playerName}** has a funny feeling like they would have been followed, but the pet name or milestone is missing!`
      : `**${playerName}** has a funny feeling like they're being followed, but the pet name or milestone is missing!`;

    msgMap.set({ ID: "FALLBACK_PET", URL: URL }, fallbackMsg);
  } else {
    // Happy path with all information.
    const msg = isDuplicate
      ? `**${playerName}** has a funny feeling like they would have been followed by **${validatedPetName}**! | **${milestone}**`
      : `**${playerName}** has a funny feeling like they're being followed by **${validatedPetName}**! | **${milestone}**`;
    msgMap.set({ ID: "PET", URL: URL }, msg);
  }
}

export default petCheck;
