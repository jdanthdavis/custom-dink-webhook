-- One-time milestones (e.g. a player's first fire cape). The unique key makes
-- each achievement fire once per player; reported_at stays NULL until a recap
-- has listed it, so the recap shows only what's new since the last run.
CREATE TABLE big_achievements (
  playername TEXT NOT NULL COLLATE NOCASE,
  achievement_id TEXT NOT NULL,
  achieved_at TEXT NOT NULL DEFAULT (datetime('now')),
  reported_at TEXT,
  PRIMARY KEY (playername, achievement_id)
);
