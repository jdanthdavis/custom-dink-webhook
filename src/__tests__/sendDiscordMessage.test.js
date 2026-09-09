import { afterEach, describe, expect, it, vi } from 'vitest';
import sendDiscordMessage from '../sendDiscordMessage';

describe('sendDiscordMessage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the content to the given URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await sendDiscordMessage('https://discord.example/webhook', 'hello');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://discord.example/webhook');
    expect(fetchMock.mock.calls[0][1].method).toBe('post');
  });

  it('retries once after a 429, honoring retry_after', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers(),
        clone() {
          return { json: async () => ({ retry_after: 0.001 }) };
        },
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const promise = sendDiscordMessage('https://discord.example/webhook', 'hello');
    await vi.runAllTimersAsync();
    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('does not throw when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(
      sendDiscordMessage('https://discord.example/webhook', 'hello')
    ).resolves.toBeUndefined();
  });

  it('attaches a file when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await sendDiscordMessage('https://discord.example/webhook', 'hello', 'fake-file');

    const body = fetchMock.mock.calls[0][1].body;
    expect(body.get('file')).toBe('fake-file');
  });
});
