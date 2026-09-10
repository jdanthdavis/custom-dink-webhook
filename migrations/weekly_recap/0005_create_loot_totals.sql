-- Loot value tracking, merged in from the standalone dink_loot database now
-- that loot is recap-only and fully weekly-scoped, same as tcg_progress/
-- deaths/collection_log - nothing technical separates it from those tables
-- anymore. Schema matches migrations/loot/0001_create_loot_totals.sql +
-- 0002_add_weekly_tracking.sql combined; the one production row was copied
-- over separately (not part of this migration - see that PR/commit).
CREATE TABLE loot_totals (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  total_value INTEGER NOT NULL DEFAULT 0,
  last_item_name TEXT,
  last_item_value INTEGER,
  last_source TEXT,
  last_drop_date TEXT,
  total_value_baseline INTEGER,
  weekly_top_item_name TEXT,
  weekly_top_item_value INTEGER
);
