//TODO: Consider sending PB to different Webhook if wanted
import checkKc from './utils.js';
export default {
  async fetch(request, env, ctx) {
    const WH_URL = env.URL;

    //TODO: uncomment once done with Postman testing
    // if (!isValidAgent(request.headers.get('User-Agent'))) {
    //   return new Response();
    // }

    const form = await request.formData();
    const payload = JSON.parse(form.get('payload_json'));
    const extra = payload.extra;
    const bossName = extra.boss;
    const killCount = extra.count;
    const playerName = extra.playerName;

    if (
      payload.type === 'KILL_COUNT' &&
      checkKc(bossName, killCount, playerName)
    ) {
      return Response.redirect(WH_URL, 307);
    }
    return new Response();
  },
};

function isValidAgent(ua) {
  if (typeof ua !== 'string') return false;
  if (!ua.startsWith('RuneLite/') && !ua.startsWith('HDOS/')) return false;
  return ua.includes('Dink/');
}
