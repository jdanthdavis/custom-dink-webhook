-- Correction to 0004: "Can It Worm" renamed to FROSTYDAD, not "Frosty Dad"
-- (a separate player). Move their pet history to FROSTYDAD; if FROSTYDAD
-- already has a row, add the totals instead and keep its newer pet details.
UPDATE OR IGNORE pets SET playername = 'FROSTYDAD' WHERE playername = 'CAN IT WORM';

UPDATE pets SET
  total_pets = total_pets + (SELECT total_pets FROM pets WHERE playername = 'CAN IT WORM'),
  total_pets_baseline = COALESCE(total_pets_baseline, 0) +
    (SELECT COALESCE(total_pets_baseline, total_pets) FROM pets WHERE playername = 'CAN IT WORM')
WHERE playername = 'FROSTYDAD'
  AND EXISTS (SELECT 1 FROM pets WHERE playername = 'CAN IT WORM');

DELETE FROM pets WHERE playername = 'CAN IT WORM';
