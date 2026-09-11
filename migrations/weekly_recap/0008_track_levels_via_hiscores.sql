-- Levels are now tracked via the OSRS Hiscores poll (same as XP), since
-- Dink goes back to reporting only 50+ level-ups - not every level. Levels
-- and XP share one per-skill row now, since Hiscores returns both in the
-- same response.
ALTER TABLE skill_xp ADD COLUMN level INTEGER;
ALTER TABLE skill_xp ADD COLUMN level_baseline INTEGER;

-- skill_levels was only ever written by Dink's per-level events, which no
-- longer happen below 50 - Hiscores is now the sole source for levels.
DROP TABLE skill_levels;
