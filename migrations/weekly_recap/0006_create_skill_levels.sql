-- Per-skill level tracking for the weekly recap - one row per player *per
-- skill*, not one row per player, so the recap can both sum levels gained
-- across every skill and find the single skill gained the most. Dink now
-- sends a LEVEL event for every level (not just 50+, see
-- LEVEL_NOTIFICATION_THRESHOLD in constants.js) so this reflects true
-- totals; Discord notifications stay limited to 50+ as before.
CREATE TABLE skill_levels (
  playername TEXT NOT NULL COLLATE NOCASE,
  skill_name TEXT NOT NULL,
  level INTEGER,
  level_baseline INTEGER,
  PRIMARY KEY (playername, skill_name)
);
