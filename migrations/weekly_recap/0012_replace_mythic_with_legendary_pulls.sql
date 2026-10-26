-- The recap's TCG Board tracks Legendary pulls instead of Mythic ones. The
-- mythic counts are dropped rather than renamed, so they don't carry over as
-- bogus Legendary numbers. Apply before the code that writes legendary_pulls
-- is deployed.
ALTER TABLE tcg_progress ADD COLUMN legendary_pulls INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tcg_progress ADD COLUMN legendary_pulls_baseline INTEGER;
ALTER TABLE tcg_progress DROP COLUMN mythic_pulls;
ALTER TABLE tcg_progress DROP COLUMN mythic_pulls_baseline;
