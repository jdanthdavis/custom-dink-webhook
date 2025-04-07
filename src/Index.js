import createFormData from './createFormData.js';
import { acceptedPayloads } from './constants.js';

export default {
  async fetch(request, env) {
    if (!isValidAgent(request.headers.get('User-Agent'))) {
      return new Response();
    }

    const form = await request.clone().formData();
    const payload = JSON.parse(form.get('payload_json'));
    const file = form.get('file');
    const extra = payload.extra;
    const payloadType = payload.type;
    const playerName = payload.playerName ? payload.playerName : payload.source;
    const embeds = payload.embeds;
    const formDataMap = new Map([
      ['ruleBroken', false],
      ['URL', ''],
    ]);
    createFormData(formDataMap, embeds, payloadType, playerName, extra, env);
    const URL = formDataMap.get('URL');

    console.log('payload - ', payload);
    console.log('ruleBroken: ', formDataMap.get('ruleBroken'));

    if (
      formDataMap.get('ruleBroken') === false &&
      acceptedPayloads.includes(payloadType)
    ) {
      let formData = new FormData();
      let response;
      const payloadToSend = {
        content: '',
        embeds: embeds.map((embed) => ({
          ...embed,
          thumbnail:
            typeof embed.thumbnail === 'string'
              ? { url: embed.thumbnail }
              : embed.thumbnail,
        })),
      };
      formData.append('payload_json', JSON.stringify(payloadToSend));

      if (file) {
        formData.append('file', file, file.name || 'attachment');
      }

      try {
        response = await fetch(URL, {
          method: 'post',
          body: formData,
        });
      } catch (error) {
        console.log('Failed to post: ', error);
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
