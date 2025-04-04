import { GrumblerCheck } from './HelperFunctions';

/**
 * Gathers the pet information
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information. See {@link https://github.com/pajlads/DinkPlugin/blob/master/docs/json-examples.md#pets} for all the information.
 * @param {*} URL - The associated URL
 */
function PetHandler(msgMap, playerName, extra, URL) {
  const { milestone, duplicate: isDuplicate, petName } = extra;
  const validatedPetName = GrumblerCheck(petName);

  // Fallback for when the game message does not contain the pet's name or the milestone it was acquired at.
  if (!validatedPetName || !milestone) {
    const fallbackMsg = isDuplicate
      ? `**${playerName}** has a funny feeling like they would have been followed, but the pet name or milestone is missing!`
      : `**${playerName}** has a funny feeling like they're being followed, but the pet name or milestone is missing!`;

    msgMap.set({ ID: 'FALLBACK_PET', URL: URL }, fallbackMsg);
  } else {
    // Happy path with all information.
    const msg = isDuplicate
      ? `**${playerName}** has a funny feeling like they would have been followed by **${validatedPetName}**! | **${milestone}**`
      : `**${playerName}** has a funny feeling like they're being followed by **${validatedPetName}**! | **${milestone}**`;
    msgMap.set({ ID: 'PET', URL: URL }, msg);
  }

  return msgMap;
}

export default PetHandler;
