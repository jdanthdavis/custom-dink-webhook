-- Running counts of Godly and Mythic pulls (dupes included) for the recap's
-- TCG Board, plus baselines so it shows the change since the last recap.
ALTER TABLE tcg_progress ADD COLUMN godly_pulls INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tcg_progress ADD COLUMN mythic_pulls INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tcg_progress ADD COLUMN godly_pulls_baseline INTEGER;
ALTER TABLE tcg_progress ADD COLUMN mythic_pulls_baseline INTEGER;
