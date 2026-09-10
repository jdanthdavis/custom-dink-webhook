import createFormData from './createFormData.js';
import { acceptedPayloads, theBoys } from './constants.js';
import sendDiscordMessage from './sendDiscordMessage.js';
import buildWeeklyRecap from './recapHandler.js';

export default {
  /**
   * Handles an incoming Dink webhook and relays notifications to Discord.
   * @param {Request} request
   * @param {*} env
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    if (!isValidAgent(request.headers.get('User-Agent'))) {
      return new Response();
    }

    let payload;
    let file = null;
    try {
      const contentType = request.headers.get('Content-Type') || '';
      if (contentType.includes('multipart/form-data')) {
        // Dink only sends multipart/form-data when it's attaching a screenshot.
        const form = await request.clone().formData();
        const payloadJson = form.get('payload_json');
        if (typeof payloadJson !== 'string') {
          throw new Error('Missing or invalid payload_json field');
        }
        payload = JSON.parse(payloadJson);
        file = form.get('file');
      } else {
        // No screenshot means Dink sends the payload as a plain JSON body instead.
        payload = await request.clone().json();
      }
    } catch (error) {
      console.log('Failed to parse request payload - ', error);
      return new Response();
    }

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
        // since the screenshots would be taken so close to each other we are fine with sending the first one twice
        await sendDiscordMessage(url.URL, msg, file);
      }
    }
    return new Response();
  },

  /**
   * Posts the weekly recap on the configured Cron Trigger schedule.
   * @param {*} event
   * @param {*} env
   * @param {*} ctx
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        const recap = await buildWeeklyRecap(
          env,
          new Date(event.scheduledTime)
        );
        if (recap) {
          await sendDiscordMessage(env.RECAP_URL, recap);
        }
      })()
    );
  },
};

/**
 * Whether a User-Agent looks like the Dink RuneLite plugin (or Postman, for testing).
 * @param {*} ua
 * @returns {boolean}
 */
export function isValidAgent(ua) {
  if (typeof ua !== 'string') return false;

  if (ua.includes('PostmanRuntime/')) return true;

  if (!ua.startsWith('RuneLite/') && !ua.startsWith('HDOS/')) return false;

  return ua.includes('Dink/');
}
