-- "Can It Worm" renamed their OSRS account to "Frosty Dad". Move their crab
-- KC to the new name; if the new name already has a row, keep it.
UPDATE OR IGNORE crab_kc SET playername = 'FROSTY DAD' WHERE playername = 'CAN IT WORM';
