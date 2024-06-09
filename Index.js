import { createFormData } from './utils.js';
export default {
  async fetch(request, env) {
    if (!isValidAgent(request.headers.get('User-Agent'))) {
      return new Response();
    }

    const form = await request.clone().formData();
    const payload = JSON.parse(form.get('payload_json'));
    const file = form.get('file');
    const extra = payload.extra;
    const playerName = payload.playerName;
    const bossName = extra.boss;
    const killCount = extra.count;
    const time = extra.time;
    const isPb = extra.isPersonalBest;
    let msgMap;

    if (payload.type === 'KILL_COUNT') {
      msgMap = createFormData(bossName, killCount, playerName, time, isPb, env);

      for (const [url, msg] of msgMap.entries()) {
        let formData = new FormData();
        formData.append('payload_json', JSON.stringify({ content: msg }));
        if (file !== null) {
          // since the screenshots would be taken so close to each other we are fine with sending the first one twice
          formData.append('file', file);
        }

        await fetch(url, {
          method: 'post',
          body: formData,
        });
      }
    }
    return new Response();
  },
};

function isValidAgent(ua) {
  if (typeof ua !== 'string') return false;

  if (!ua.startsWith('RuneLite/') && !ua.startsWith('HDOS/')) return false;

  return ua.includes('Dink/');
}
