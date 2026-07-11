import createFormData from './createFormData.js';
import { acceptedPayloads, theBoys } from './constants.js';

export default {
  /**
   * Handles an incoming Dink webhook request and relays formatted
   * notifications to the configured Discord webhook URLs.
   * @param {Request} request - The incoming webhook request
   * @param {*} env - The Worker's environment bindings (URLs/secrets)
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    if (!isValidAgent(request.headers.get('User-Agent'))) {
      return new Response();
    }

    let form;
    let payload;
    try {
      form = await request.clone().formData();
      const payloadJson = form.get('payload_json');
      if (typeof payloadJson !== 'string') {
        throw new Error('Missing or invalid payload_json field');
      }
      payload = JSON.parse(payloadJson);
    } catch (error) {
      console.log('Failed to parse request payload - ', error);
      return new Response();
    }

    const file = form.get('file');
    const extra = payload.extra;
    const payloadType = payload.type;
    const playerName = payload.playerName ? payload.playerName : payload.source;
    const content = payload.content;
    let msgMap;

    console.log('payload - ', payload);

    if (
      acceptedPayloads.includes(payloadType) &&
      theBoys.includes(playerName?.toUpperCase())
    ) {
      msgMap = await createFormData(
        extra,
        content,
        payloadType,
        playerName,
        env
      );

      for (const [url, msg] of msgMap.entries()) {
        console.log(url, msg);
        let formData = new FormData();
        let response;
        formData.append('payload_json', JSON.stringify({ content: msg }));
        if (file !== null && !extra?.message?.startsWith('!Fetchpets')) {
          // since the screenshots would be taken so close to each other we are fine with sending the first one twice
          formData.append('file', file);
        }

        try {
          response = await fetch(url.URL, {
            method: 'post',
            body: formData,
          });

          if (response.status === 429) {
            const retryBody = await response
              .clone()
              .json()
              .catch(() => null);
            const retryAfterSeconds =
              Number(
                retryBody?.retry_after ?? response.headers.get('Retry-After')
              ) || 1;
            console.log(
              `Rate limited, retrying after ${retryAfterSeconds}s`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, retryAfterSeconds * 1000)
            );
            response = await fetch(url.URL, {
              method: 'post',
              body: formData,
            });
          }
        } catch (error) {
          console.log('There was an error - ', error);
        }

        if (!response?.ok) {
          console.log(`Response Code: ${response?.status}`);
        }
      }
    }
    return new Response();
  },
};

/**
 * Checks whether a request's User-Agent header looks like it came from the
 * Dink RuneLite plugin (or Postman, for manual testing).
 * @param {*} ua - The raw User-Agent header value
 * @returns {boolean}
 */
export function isValidAgent(ua) {
  if (typeof ua !== 'string') return false;

  if (ua.includes('PostmanRuntime/')) return true;

  if (!ua.startsWith('RuneLite/') && !ua.startsWith('HDOS/')) return false;

  return ua.includes('Dink/');
}
