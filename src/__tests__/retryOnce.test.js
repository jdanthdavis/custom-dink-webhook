import { describe, expect, it, vi } from 'vitest';
import retryOnce from '../core/helperFunctions/retryOnce';

describe('retryOnce', () => {
  it('returns the result on the first try when it succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(retryOnce(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries once and returns the result if the second try succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce('ok');
    await expect(retryOnce(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('rejects if both attempts fail', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('still broken'));
    await expect(retryOnce(fn)).rejects.toThrow('still broken');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
