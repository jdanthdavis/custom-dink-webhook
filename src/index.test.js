import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { isValidAgent } from './index.js';

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

    await worker.fetch(request, { DEATH_URL: 'https://discord.example/webhook' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://discord.example/webhook');
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

    await worker.fetch(request, { DEATH_URL: 'https://discord.example/webhook' });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});