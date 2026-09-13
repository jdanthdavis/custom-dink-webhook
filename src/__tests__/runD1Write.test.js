import { describe, expect, it, vi } from 'vitest';
import runD1Write from '../core/helperFunctions/runD1Write';

describe('runD1Write', () => {
  it('resolves without logging when the write succeeds on the first try', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fn = vi.fn().mockResolvedValue({ success: true });
    const buildFixSql = vi.fn();

    await runD1Write(fn, { label: 'testWrite', buildFixSql });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(buildFixSql).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('retries once and resolves without logging if the retry succeeds', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce({ success: true });
    const buildFixSql = vi.fn();

    await runD1Write(fn, { label: 'testWrite', buildFixSql });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(buildFixSql).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('logs the label and fix-it SQL only after both attempts fail', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fn = vi.fn().mockRejectedValue(new Error('still broken'));
    const buildFixSql = vi
      .fn()
      .mockReturnValue("UPDATE foo SET x = 1 WHERE playername = 'Swap';");

    await runD1Write(fn, { label: 'testWrite', buildFixSql });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(buildFixSql).toHaveBeenCalledTimes(1);
    const [logMessage, loggedError] = consoleSpy.mock.calls[0];
    expect(logMessage).toContain('testWrite FAILED after retry');
    expect(logMessage).toContain(
      "UPDATE foo SET x = 1 WHERE playername = 'Swap';"
    );
    expect(loggedError).toBe('still broken');
    consoleSpy.mockRestore();
  });

  it('never rejects, even when both attempts fail', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('still broken'));
    await expect(
      runD1Write(fn, { label: 'testWrite', buildFixSql: () => '' })
    ).resolves.toBeUndefined();
  });
});
