import checkKc from './utils.js';
export default {
  async fetch(request, env) {
    const { KC_URL, PB_URL } = env;

    if (!isValidAgent(request.headers.get('User-Agent'))) {
      return new Response();
    }

    const form = await request.clone().formData();
    const payload = JSON.parse(form.get('payload_json'));
    const extra = payload.extra;
    const bossName = extra.boss;
    const killCount = extra.count;
    const isPb = extra.isPersonalBest && killCount !== 1;
    const playerName = payload.playerName;

    if (
      (payload.type === 'KILL_COUNT' &&
        checkKc(bossName, killCount, playerName)) ||
      (payload.type === 'KILL_COUNT' && isPb)
    ) {
      return await fetch(!isPb ? KC_URL : PB_URL, request);
    }
    return new Response();
  },
};

function isValidAgent(ua) {
  if (typeof ua !== 'string') return false;

  if (!ua.startsWith('RuneLite/') && !ua.startsWith('HDOS/')) return false;

  return ua.includes('Dink/');
}
