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
    const playerName = payload.playerName ? payload.playerName : payload.source;
    const bossName = extra.boss;
    const killCount = extra.count;
    const time = extra.time;
    const isPb = extra.isPersonalBest;
    const isChatting = payload.type === 'CHAT';
    let msgMap;

    if (payload.type === 'KILL_COUNT' || payload.type === 'CHAT') {
      msgMap = createFormData(
        bossName,
        killCount,
        playerName,
        time,
        isPb,
        isChatting,
        env
      );

      for (const [url, msg] of msgMap.entries()) {
        let formData = new FormData();
        let response;
        formData.append('payload_json', JSON.stringify({ content: msg }));
        if (file !== null) {
          // since the screenshots would be taken so close to each other we are fine with sending the first one twice
          formData.append('file', file);
        }

        try {
          response = await fetch(url, {
            method: 'post',
            body: formData,
          });
        } catch (error) {
          console.log('There was an error - ', error);
        }

        if (!response.ok) {
          console.log(`Response Code: ${response?.status}`);
        }
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
