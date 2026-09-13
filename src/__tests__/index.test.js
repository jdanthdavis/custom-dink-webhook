import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { isValidAgent } from '../index.js';

describe('isValidAgent', () => {
  it('accepts RuneLite user agents that mention Dink', () => {
    expect(isValidAgent('RuneLite/1.10.0 Dink/1.8.0')).toBe(true);
  });

  it('accepts HDOS user agents that mention Dink', () => {
    expect(isValidAgent('HDOS/1.0.0 Dink/1.8.0')).toBe(true);
  });

  it('accepts Postman for manual testing', () => {
    expect(isValidAgent('PostmanRuntime/7.36.0')).toBe(true);
  });

  it('rejects RuneLite user agents without Dink', () => {
    expect(isValidAgent('RuneLite/1.10.0')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidAgent(null)).toBe(false);
    expect(isValidAgent(undefined)).toBe(false);
  });
});

describe('worker.fetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** @param {{ userAgent?: string, payload?: string }} options */
  function buildRequest({ userAgent, payload }) {
    const formData = new FormData();
    if (payload !== undefined) {
      formData.append('payload_json', payload);
    }
    return new Request('https://worker.example/webhook', {
      method: 'POST',
      headers: userAgent ? { 'User-Agent': userAgent } : {},
      body: formData,
    });
  }

  it('rejects requests with an invalid User-Agent without touching fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const request = buildRequest({
      userAgent: 'curl/8.0',
      payload: JSON.stringify({ type: 'DEATH', playerName: 'LSX SWAP' }),
    });
    const response = await worker.fetch(request, {});

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not throw on malformed payload_json', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const request = buildRequest({
      userAgent: 'RuneLite/1.10.0 Dink/1.8.0',
      payload: 'not valid json',
    });

    await expect(worker.fetch(request, {})).resolves.toBeInstanceOf(Response);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not throw when payload_json is missing entirely', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const request = buildRequest({
      userAgent: 'RuneLite/1.10.0 Dink/1.8.0',
      payload: undefined,
    });

    await expect(worker.fetch(request, {})).resolves.toBeInstanceOf(Response);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts a formatted message to Discord for an allowlisted player', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const request = buildRequest({
      userAgent: 'RuneLite/1.10.0 Dink/1.8.0',
      payload: JSON.stringify({
        type: 'DEATH',
        playerName: 'LSX SWAP',
        extra: {
          isPvp: false,
          keptItems: [],
          lostItems: [],
          location: { regionId: 1 },
        },
      }),
    });

    await worker.fetch(request, {
      DEATH_URL: 'https://discord.example/webhook',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://discord.example/webhook');
  });

  it('parses a plain JSON body when no screenshot is attached', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request('https://worker.example/webhook', {
      method: 'POST',
      headers: {
        'User-Agent': 'RuneLite/1.10.0 Dink/1.8.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'DEATH',
        playerName: 'LSX SWAP',
        extra: {
          isPvp: false,
          keptItems: [],
          lostItems: [],
          location: { regionId: 1 },
        },
      }),
    });

    await worker.fetch(request, {
      DEATH_URL: 'https://discord.example/webhook',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://discord.example/webhook');
  });

  it('does not throw on a malformed plain JSON body', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request('https://worker.example/webhook', {
      method: 'POST',
      headers: {
        'User-Agent': 'RuneLite/1.10.0 Dink/1.8.0',
        'Content-Type': 'application/json',
      },
      body: 'not valid json',
    });

    await expect(worker.fetch(request, {})).resolves.toBeInstanceOf(Response);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not post to Discord for a non-allowlisted player', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const request = buildRequest({
      userAgent: 'RuneLite/1.10.0 Dink/1.8.0',
      payload: JSON.stringify({
        type: 'DEATH',
        playerName: 'RANDOM STRANGER',
        extra: {
          isPvp: false,
          keptItems: [],
          lostItems: [],
          location: { regionId: 1 },
        },
      }),
    });

    await worker.fetch(request, {
      DEATH_URL: 'https://discord.example/webhook',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('worker.scheduled', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** @param {*} [db] */
  function makeEnv(db = { prepare: vi.fn() }) {
    return {
      WEEKLY_RECAP_DB: db,
      PETS_DB: db,
      RECAP_URL: 'https://discord.example/recap',
    };
  }

  /** Collects every promise passed to ctx.waitUntil() so the test can await it. */
  function makeCtx() {
    const pending = [];
    return { pending, waitUntil: (p) => pending.push(p) };
  }

  it('skips without posting when the event lands on a day other than Monday', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    // 2026-09-13 is a Sunday - simulates the observed Cron Trigger misfire,
    // where event.cron still reads "0 14 * * 1" despite firing on the wrong day.
    const event = {
      cron: '0 14 * * 1',
      scheduledTime: new Date('2026-09-13T14:00:58Z').getTime(),
    };
    const ctx = makeCtx();

    await worker.scheduled(event, makeEnv(), ctx);
    await Promise.all(ctx.pending);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('proceeds normally when the event actually lands on Monday', async () => {
    // Generic response shape covers both the Hiscores polls (which read
    // .json()) and the Discord webhook post (which doesn't).
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ skills: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const db = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: [
            { playername: 'Swap', total_pets: 5, total_pets_baseline: 3 },
          ],
        }),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
    };
    const event = {
      cron: '0 14 * * 1',
      scheduledTime: new Date('2026-09-14T14:00:00Z').getTime(),
    };
    const ctx = makeCtx();

    await worker.scheduled(event, makeEnv(db), ctx);
    await Promise.all(ctx.pending);

    // The pets section has a real delta, so the recap builds and posts -
    // the Hiscores poll calls fetch too, so just check the Discord webhook
    // was one of the calls made, not an exact count.
    expect(
      fetchMock.mock.calls.some(
        ([url]) => url === 'https://discord.example/recap'
      )
    ).toBe(true);
  });
});
