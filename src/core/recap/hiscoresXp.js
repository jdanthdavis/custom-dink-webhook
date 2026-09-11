const HISCORES_URL =
  'https://secure.runescape.com/m=hiscore_oldschool/index_lite.json';

/**
 * Fetches one player's current per-skill level and XP from the public OSRS
 * Hiscores API, including "Overall". Filters out unranked skills (`xp: -1`).
 * @param {string} playername - case-insensitive
 * @returns {Promise<Array<{ skillName: string, level: number, xp: number }>|null>} null on error or non-OK response
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
      .map((skill) => ({
        skillName: skill.name,
        level: skill.level,
        xp: skill.xp,
      }));
  } catch (error) {
    console.log(
      `fetchPlayerHiscoresXp(${playername}) error:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Upserts a player's current per-skill level and XP snapshot into `skill_xp`.
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} playername
 * @param {Array<{ skillName: string, level: number, xp: number }>} skills
 */
async function recordPlayerHiscoresXp(WEEKLY_RECAP_DB, playername, skills) {
  try {
    await Promise.all(
      skills.map(({ skillName, level, xp }) =>
        WEEKLY_RECAP_DB.prepare(
          `INSERT INTO skill_xp (playername, skill_name, level, xp)
           VALUES (?1, ?2, ?3, ?4)
           ON CONFLICT(playername, skill_name) DO UPDATE SET
             level = COALESCE(?3, level),
             xp = COALESCE(?4, xp)`
        )
          .bind(playername, skillName, level ?? null, xp ?? null)
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
 * Fetches and records Hiscores XP for every player independently, so one
 * failure doesn't block the others.
 * @param {*} WEEKLY_RECAP_DB
 * @param {string[]} playernames
 */
export async function fetchAndRecordAllHiscoresXp(
  WEEKLY_RECAP_DB,
  playernames
) {
  await Promise.allSettled(
    playernames.map(async (playername) => {
      const skills = await fetchPlayerHiscoresXp(playername);
      if (skills && skills.length > 0) {
        await recordPlayerHiscoresXp(WEEKLY_RECAP_DB, playername, skills);
      }
    })
  );
}
