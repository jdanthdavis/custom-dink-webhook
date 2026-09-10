-- Death count + GP lost, a pure counter (like pets/loot/crab) rather than a
-- snapshot-replace domain (like tcg_progress) - Dink reports one death at a
-- time, never a running total.
CREATE TABLE deaths (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  death_count INTEGER NOT NULL DEFAULT 0,
  total_value_lost INTEGER NOT NULL DEFAULT 0,
  death_count_baseline INTEGER,
  total_value_lost_baseline INTEGER
);
