const HISCORES_URL =
  'https://secure.runescape.com/m=hiscore_oldschool/index_lite.json';

/**
 * Fetches one player's current per-skill XP from the public OSRS Hiscores
 * API, including "Overall" - that's the authoritative total XP figure (used
 * directly for "Total XP Gained" rather than summed from individual skills,
 * since a player can have real XP in a skill they aren't ranked in yet,
 * which never shows up per-skill). A skill the account isn't ranked in comes
 * back as `xp: -1` and is filtered out rather than stored as a real value.
 * @param {string} playername - Case-insensitive; the Hiscores API doesn't care about casing
 * @returns {Promise<Array<{ skillName: string, xp: number }>|null>} null on a network error or non-OK response
 */
export async function fetchPlayerHiscoresXp(playername) {
  try {
    const response = await fetch(
      `${HISCORES_URL}?player=${encodeURIComponent(playername)}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    return data.skills
      .filter((skill) => skill.xp >= 0)
      .map((skill) => ({ skillName: skill.name, xp: skill.xp }));
  } catch (error) {
    console.log(
      `fetchPlayerHiscoresXp(${playername}) error:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Upserts a player's current per-skill XP snapshot into `skill_xp`.
 * `COALESCE`-guarded, same shape as `recordSkillLevels` in
 * levelUpHandler.js - a skill's current XP on every fetch, not a delta.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @param {string} playername
 * @param {Array<{ skillName: string, xp: number }>} skills
 */
async function recordPlayerHiscoresXp(WEEKLY_RECAP_DB, playername, skills) {
  try {
    await Promise.all(
      skills.map(({ skillName, xp }) =>
        WEEKLY_RECAP_DB.prepare(
          `INSERT INTO skill_xp (playername, skill_name, xp)
           VALUES (?1, ?2, ?3)
           ON CONFLICT(playername, skill_name) DO UPDATE SET
             xp = COALESCE(?3, xp)`
        )
          .bind(playername, skillName, xp ?? null)
          .run()
      )
    );
  } catch (error) {
    console.log(
      'recordPlayerHiscoresXp ',
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Fetches and records current Hiscores XP for every player in `playernames`.
 * Each player is independent (`Promise.allSettled`) - one player's network
 * failure, Hiscores 404, or unranked account doesn't block the others.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @param {string[]} playernames
 */
export async function fetchAndRecordAllHiscoresXp(WEEKLY_RECAP_DB, playernames) {
  await Promise.allSettled(
    playernames.map(async (playername) => {
      const skills = await fetchPlayerHiscoresXp(playername);
      if (skills && skills.length > 0) {
        await recordPlayerHiscoresXp(WEEKLY_RECAP_DB, playername, skills);
      }
    })
  );
}
