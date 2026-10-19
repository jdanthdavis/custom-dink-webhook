-- GP lost is no longer tracked or shown in the recap's Deaths Board; only
-- the death count remains. Apply only after the code that stops writing
-- total_value_lost is deployed - the old recordDeath INSERT names it.
ALTER TABLE deaths DROP COLUMN total_value_lost;
ALTER TABLE deaths DROP COLUMN total_value_lost_baseline;
