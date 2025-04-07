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
      ['URLs', []],
    ]);

    createFormData(formDataMap, embeds, payloadType, playerName, extra, env);
    const URLs = formDataMap.get('URLs') || [];

    console.log('payload - ', payload);
    console.log('ruleBroken: ', formDataMap.get('ruleBroken'));

    if (
      formDataMap.get('ruleBroken') === false &&
      acceptedPayloads.includes(payloadType)
    ) {
      let formData = new FormData();
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

      for (const URL of URLs) {
        try {
          const response = await fetch(URL, {
            method: 'post',
            body: formData,
          });

          if (!response.ok) {
            console.log(
              `Failed to post to ${URL}, Response Code: ${response?.status}`
            );
          }
        } catch (error) {
          console.log(`Failed to post to ${URL}: `, error);
        }
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
