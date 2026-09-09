import { describe, expect, it, vi } from 'vitest';
import getSingleColumn from '../core/helperFunctions/getSingleColumn';

describe('getSingleColumn', () => {
  it('returns the column value for an existing row', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ total_pets: 5 }),
      }),
    };

    const result = await getSingleColumn(DB, 'pets', 'total_pets', 'Swap');

    expect(result).toBe(5);
    expect(DB.prepare).toHaveBeenCalledWith('SELECT total_pets FROM pets WHERE playername = ?');
  });

  it('returns null when the row does not exist', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(undefined),
      }),
    };

    expect(await getSingleColumn(DB, 'pets', 'total_pets', 'Nobody')).toBeNull();
  });

  it('returns null and logs when the query fails', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };

    expect(await getSingleColumn(DB, 'crab_kc', 'count', 'Swap', 'getTotalCrabKc')).toBeNull();
  });
});
