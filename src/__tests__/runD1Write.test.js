import { describe, expect, it, vi } from 'vitest';
import runD1Write from '../core/helperFunctions/runD1Write';

/** @param {*} run */
function makeDb(run) {
  return {
    prepare: vi.fn().mockReturnValue({ bind: vi.fn().mockReturnThis(), run }),
  };
}

describe('runD1Write', () => {
  it('resolves without logging when the write succeeds on the first try', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn().mockResolvedValue({ success: true });

    await runD1Write(makeDb(run), {
      label: 'testWrite',
      sql: 'UPDATE foo SET x = ?1 WHERE playername = ?2',
      values: [1, 'Swap'],
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('retries once and resolves without logging if the retry succeeds', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce({ success: true });

    await runD1Write(makeDb(run), {
      label: 'testWrite',
      sql: 'UPDATE foo SET x = ?1 WHERE playername = ?2',
      values: [1, 'Swap'],
    });

    expect(run).toHaveBeenCalledTimes(2);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('logs the label and a fix-it SQL rendered from the same sql/values after both attempts fail', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn().mockRejectedValue(new Error('still broken'));

    await runD1Write(makeDb(run), {
      label: 'testWrite',
      sql: 'UPDATE foo SET x = ?1 WHERE playername = ?2',
      values: [1, 'Swap'],
    });

    expect(run).toHaveBeenCalledTimes(2);
    const [logMessage, loggedError] = consoleSpy.mock.calls[0];
    expect(logMessage).toContain('testWrite FAILED after retry');
    expect(logMessage).toContain(
      "UPDATE foo SET x = 1 WHERE playername = 'Swap'"
    );
    expect(loggedError).toBe('still broken');
    consoleSpy.mockRestore();
  });

  it('renders a numbered placeholder used more than once from the same value', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn().mockRejectedValue(new Error('fail'));

    await runD1Write(makeDb(run), {
      label: 'testWrite',
      sql: 'UPDATE foo SET x = ?1, y = ?1 WHERE playername = ?2',
      values: [5, 'Swap'],
    });

    const [logMessage] = consoleSpy.mock.calls[0];
    expect(logMessage).toContain('SET x = 5, y = 5');
    consoleSpy.mockRestore();
  });

  it('renders bare positional placeholders in order', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn().mockRejectedValue(new Error('fail'));

    await runD1Write(makeDb(run), {
      label: 'testWrite',
      sql: 'INSERT INTO foo (a, b) VALUES (?, ?)',
      values: ['Swap', 5],
    });

    const [logMessage] = consoleSpy.mock.calls[0];
    expect(logMessage).toContain("VALUES ('Swap', 5)");
    consoleSpy.mockRestore();
  });

  it('renders null/undefined values as SQL NULL', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn().mockRejectedValue(new Error('fail'));

    await runD1Write(makeDb(run), {
      label: 'testWrite',
      sql: 'INSERT INTO foo (a, b) VALUES (?1, ?2)',
      values: [null, undefined],
    });

    const [logMessage] = consoleSpy.mock.calls[0];
    expect(logMessage).toContain('VALUES (NULL, NULL)');
    consoleSpy.mockRestore();
  });

  it('escapes a single quote in a string value', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn().mockRejectedValue(new Error('fail'));

    await runD1Write(makeDb(run), {
      label: 'testWrite',
      sql: 'INSERT INTO foo (playername) VALUES (?1)',
      values: ["O'Brien"],
    });

    const [logMessage] = consoleSpy.mock.calls[0];
    expect(logMessage).toContain("VALUES ('O''Brien')");
    consoleSpy.mockRestore();
  });

  it('appends the optional note to the failure log', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn().mockRejectedValue(new Error('fail'));

    await runD1Write(makeDb(run), {
      label: 'testWrite',
      sql: 'UPDATE foo SET x = ?1',
      values: [1],
      note: 'extra context',
    });

    const [logMessage] = consoleSpy.mock.calls[0];
    expect(logMessage).toContain('(extra context)');
    consoleSpy.mockRestore();
  });

  it('never rejects, even when both attempts fail', async () => {
    const run = vi.fn().mockRejectedValue(new Error('still broken'));
    await expect(
      runD1Write(makeDb(run), {
        label: 'testWrite',
        sql: 'UPDATE foo SET x = ?1',
        values: [1],
      })
    ).resolves.toBeUndefined();
  });
});
