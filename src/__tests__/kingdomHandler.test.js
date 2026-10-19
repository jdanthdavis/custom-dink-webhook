import { describe, expect, it, vi } from 'vitest';
import { kingdomHandler } from '../core/chatMsgHandler/kingdomHandler';

const kingdomMessage = (approval, coffer = '1.00M') =>
  `Your Kingdom of Miscellania approval is ${approval}%, and your coffer has ${coffer} coins.`;
const discordIds = JSON.stringify({ 'pigeon cam': '123456789012345678' });

const run = async (message, name = 'Pigeon Cam', ...rest) => {
  const [secret, kv] = rest.length ? rest : [discordIds];
  const msgMap = new Map();
  await kingdomHandler(message, name, msgMap, 'url', secret, kv);
  return msgMap;
};

describe('kingdomHandler', () => {
  it('pings the player when their Discord ID is known', async () => {
    const msgMap = await run(kingdomMessage(72));
    expect([...msgMap.keys()][0].URL).toBe('url');
    expect([...msgMap.values()][0]).toBe(
      '**<@123456789012345678>** your **Kingdom of Miscellania** approval rating is too low!\n' +
        '-# Approval Rating: 72% | Coffer: 1.00M gp'
    );
  });

  it('does not post when the player has no Discord ID', async () => {
    expect((await run(kingdomMessage(72), 'LSx Swap')).size).toBe(0);
  });

  it.each([undefined, '{oops'])(
    'does not post when the IDs secret is %s',
    async (secret) => {
      expect((await run(kingdomMessage(72), 'Pigeon Cam', secret)).size).toBe(
        0
      );
    }
  );

  it('fires at exactly the threshold', async () => {
    expect((await run(kingdomMessage(90))).size).toBe(1);
  });

  it.each([91, 98, 100])('does not fire at %i%% approval', async (approval) => {
    expect((await run(kingdomMessage(approval))).size).toBe(0);
  });

  it.each(['750K', '7,500,000', '0'])(
    'handles a coffer of %s',
    async (coffer) => {
      const msgMap = await run(kingdomMessage(50, coffer));
      expect([...msgMap.values()][0]).toContain(`Coffer: ${coffer} gp`);
    }
  );

  describe('which threshold triggered', () => {
    const body = async (approval, coffer) =>
      [...(await run(kingdomMessage(approval, coffer))).values()][0];
    const id = '**<@123456789012345678>** your **Kingdom of Miscellania**';

    it('says approval rating when only approval is low', async () => {
      expect(await body(72, '1.00M')).toContain(
        `${id} approval rating is too low!`
      );
    });

    it('says coffer when only the coffer is low', async () => {
      expect(await body(100, '700K')).toContain(`${id} coffer is too low!`);
    });

    it('says both when approval and coffer are low', async () => {
      expect(await body(72, '700K')).toContain(
        `${id} approval rating and coffer is too low!`
      );
    });
  });

  describe('coffer threshold', () => {
    it.each(['749,999', '700K', '0.50M', '0'])(
      'fires for a low coffer of %s even with good approval',
      async (coffer) => {
        expect((await run(kingdomMessage(100, coffer))).size).toBe(1);
      }
    );

    it.each(['750K', '750,000', '0.75M', '1.00M', '1.2B'])(
      'does not fire for a coffer of %s with good approval',
      async (coffer) => {
        expect((await run(kingdomMessage(100, coffer))).size).toBe(0);
      }
    );

    it('does not fire on an unparseable coffer with good approval', async () => {
      expect((await run(kingdomMessage(100, '1.2.3'))).size).toBe(0);
    });
  });

  it('does not set a message when the text does not match', async () => {
    expect((await run('unrelated message')).size).toBe(0);
  });

  describe('cooldown', () => {
    const createFakeKV = () => {
      const store = new Map();
      return {
        get: vi.fn(async (k) => store.get(k) ?? null),
        put: vi.fn(async (k, v) => void store.set(k, v)),
      };
    };

    it('pings once, then suppresses repeats from world hops/logins', async () => {
      const kv = createFakeKV();
      const msg = kingdomMessage(72);
      expect((await run(msg, 'Pigeon Cam', discordIds, kv)).size).toBe(1);
      expect((await run(msg, 'Pigeon Cam', discordIds, kv)).size).toBe(0);
      expect((await run(msg, 'PIGEON CAM', discordIds, kv)).size).toBe(0);
      expect(kv.put).toHaveBeenCalledTimes(1);
      expect(kv.put.mock.calls[0][2]).toEqual({ expirationTtl: 86400 });
    });

    it('does not start a cooldown for players it cannot ping', async () => {
      const kv = createFakeKV();
      await run(kingdomMessage(72), 'LSx Swap', discordIds, kv);
      expect(kv.put).not.toHaveBeenCalled();
    });

    it('does not start a cooldown above the threshold', async () => {
      const kv = createFakeKV();
      await run(kingdomMessage(95), 'Pigeon Cam', discordIds, kv);
      expect(kv.put).not.toHaveBeenCalled();
    });

    it('still pings if KV throws', async () => {
      const kv = {
        get: vi.fn().mockRejectedValue(new Error('kv down')),
        put: vi.fn(),
      };
      expect(
        (await run(kingdomMessage(72), 'Pigeon Cam', discordIds, kv)).size
      ).toBe(1);
    });
  });
});
