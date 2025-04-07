import createFormData from './createFormData.js';
import { acceptedPayloads } from './constants.js';

export default {
  async fetch(request, env) {
    if (!isValidAgent(request.headers.get('User-Agent'))) {
      return new Response();
    }

    const form = await request.clone().formData();
    const payload = JSON.parse(form.get('payload_json'));
    const extra = payload.extra;
    const payloadType = payload.type;
    const playerName = payload.playerName ? payload.playerName : payload.source;
    const embeds = payload.embeds;
    const content = payload.content;
    let URL;

    console.log('payload - ', payload);

    if (acceptedPayloads.includes(payloadType)) {
      createFormData(extra, payloadType, playerName, env, embeds, URL);

      let formData;
      let response;
      const payloadToSend = {
        content,
        embeds: originalEmbed.map((embed) => ({
          ...embed,
          thumbnail:
            typeof embed.thumbnail === 'string'
              ? { url: embed.thumbnail }
              : embed.thumbnail,
        })),
      };
      formData.append('payload_json', JSON.stringify(payloadToSend));

      try {
        response = await fetch(URL, {
          method: 'post',
          body: formData,
        });
      } catch (error) {
        console.log(error);
      }

      if (!response.ok) {
        console.log(`Response Code: ${response?.status}`);
      }
    }
    return new Response();
  },
};

function isValidAgent(ua) {
  if (typeof ua !== 'string') return false;

  if (ua.includes('PostmanRuntime/')) return true;

  if (!ua.startsWith('RuneLite/') && !ua.startsWith('HDOS/')) return false;

  return ua.includes('Dink/');
}
