-- Lifetime loot value tracking (items over LOOT_THRESHOLD, the same ones lootHandler announces).
CREATE TABLE loot_totals (
  playername TEXT PRIMARY KEY COLLATE NOCASE,
  total_value INTEGER NOT NULL DEFAULT 0,
  last_item_name TEXT,
  last_item_value INTEGER,
  last_source TEXT,
  last_drop_date TEXT
);
