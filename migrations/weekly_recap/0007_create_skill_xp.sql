-- Per-skill XP tracking for the Levels Board, sourced from the public OSRS
-- Hiscores API (src/core/recap/hiscoresXp.js) rather than Dink - Dink only
-- reports level-ups, so a maxed/near-maxed skill can gain huge amounts of
-- real XP with zero events. One row per player per skill, same shape as
-- skill_levels, so the recap can find the single skill with the most XP
-- gained. No "Overall" row - overall XP gained is derived by summing every
-- skill's delta in JS.
CREATE TABLE skill_xp (
  playername TEXT NOT NULL COLLATE NOCASE,
  skill_name TEXT NOT NULL,
  xp INTEGER,
  xp_baseline INTEGER,
  PRIMARY KEY (playername, skill_name)
);
