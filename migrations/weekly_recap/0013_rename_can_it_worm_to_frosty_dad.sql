-- "Can It Worm" renamed their OSRS account to "Frosty Dad" (a different
-- player from FrostyDad). Move their recap history over to the new name.
--
-- UPDATE OR IGNORE: if the new name already has a row (it started logging
-- events under it after the rename), keep that row and leave the old one
-- behind - it's no longer in theBoys, so nothing reads it.
UPDATE OR IGNORE tcg_progress SET playername = 'FROSTY DAD' WHERE playername = 'CAN IT WORM';
UPDATE OR IGNORE deaths SET playername = 'FROSTY DAD' WHERE playername = 'CAN IT WORM';
UPDATE OR IGNORE collection_log SET playername = 'FROSTY DAD' WHERE playername = 'CAN IT WORM';
UPDATE OR IGNORE loot_totals SET playername = 'FROSTY DAD' WHERE playername = 'CAN IT WORM';
UPDATE OR IGNORE big_achievements SET playername = 'FROSTY DAD' WHERE playername = 'CAN IT WORM';

-- skill_xp is a Hiscores snapshot polled by name, so it's dropped rather than
-- moved: the old name no longer exists on Hiscores, and the new name's rows
-- are re-seeded by the next poll (NULL baselines are skipped for one recap).
DELETE FROM skill_xp WHERE playername = 'CAN IT WORM';
