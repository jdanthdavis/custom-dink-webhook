-- Correction to 0013. "Can It Worm" renamed to FROSTYDAD (FrostyDad), NOT to
-- "Frosty Dad" - that is a separate, unrelated player. Merge Can It Worm's
-- history into FROSTYDAD, which already has the data logged since the rename.
--
-- Snapshot data the game re-reports (collection log entries, TCG score and
-- card counts) keeps FROSTYDAD's newer values. Running counters (loot value,
-- deaths, godly/legendary pulls) are added together, and their baselines too
-- so this week's deltas stay the sum of both.

-- Rows FROSTYDAD doesn't have yet simply move across.
UPDATE OR IGNORE collection_log SET playername = 'FROSTYDAD' WHERE playername = 'CAN IT WORM';
UPDATE OR IGNORE deaths SET playername = 'FROSTYDAD' WHERE playername = 'CAN IT WORM';
UPDATE OR IGNORE loot_totals SET playername = 'FROSTYDAD' WHERE playername = 'CAN IT WORM';
UPDATE OR IGNORE tcg_progress SET playername = 'FROSTYDAD' WHERE playername = 'CAN IT WORM';

-- Rows both names have: add the counters, then drop the old row.
UPDATE loot_totals SET
  total_value = total_value + (SELECT total_value FROM loot_totals WHERE playername = 'CAN IT WORM'),
  total_value_baseline = COALESCE(total_value_baseline, 0) +
    (SELECT COALESCE(total_value_baseline, total_value) FROM loot_totals WHERE playername = 'CAN IT WORM')
WHERE playername = 'FROSTYDAD'
  AND EXISTS (SELECT 1 FROM loot_totals WHERE playername = 'CAN IT WORM');

UPDATE deaths SET
  death_count = death_count + (SELECT death_count FROM deaths WHERE playername = 'CAN IT WORM'),
  death_count_baseline = COALESCE(death_count_baseline, 0) +
    (SELECT COALESCE(death_count_baseline, death_count) FROM deaths WHERE playername = 'CAN IT WORM')
WHERE playername = 'FROSTYDAD'
  AND EXISTS (SELECT 1 FROM deaths WHERE playername = 'CAN IT WORM');

UPDATE tcg_progress SET
  godly_pulls = godly_pulls + (SELECT godly_pulls FROM tcg_progress WHERE playername = 'CAN IT WORM'),
  godly_pulls_baseline = COALESCE(godly_pulls_baseline, 0) +
    (SELECT COALESCE(godly_pulls_baseline, godly_pulls) FROM tcg_progress WHERE playername = 'CAN IT WORM'),
  legendary_pulls = legendary_pulls + (SELECT legendary_pulls FROM tcg_progress WHERE playername = 'CAN IT WORM'),
  legendary_pulls_baseline = COALESCE(legendary_pulls_baseline, 0) +
    (SELECT COALESCE(legendary_pulls_baseline, legendary_pulls) FROM tcg_progress WHERE playername = 'CAN IT WORM')
WHERE playername = 'FROSTYDAD'
  AND EXISTS (SELECT 1 FROM tcg_progress WHERE playername = 'CAN IT WORM');

DELETE FROM loot_totals WHERE playername = 'CAN IT WORM';
DELETE FROM deaths WHERE playername = 'CAN IT WORM';
DELETE FROM tcg_progress WHERE playername = 'CAN IT WORM';
DELETE FROM collection_log WHERE playername = 'CAN IT WORM';

-- 0013 moved this into FROSTY DAD, which is the wrong player. Move it back to
-- the right one. Only this achievement (from Can It Worm's pet #20 on
-- 2026-11-02) - anything else under FROSTY DAD is theirs and stays.
UPDATE OR IGNORE big_achievements
  SET playername = 'FROSTYDAD'
  WHERE playername = 'FROSTY DAD' AND achievement_id = 'total_pets_20'
    AND achieved_at = '2026-11-02 18:16:22';
