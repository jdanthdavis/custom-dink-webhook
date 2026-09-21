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
   * Posts the weekly recap once a week, on the hourly Cron Trigger tick that
   * lands at 9am America/New_York on a Monday (see wrangler.toml - the trigger
   * itself just fires hourly since Cron Triggers have no DST awareness).
   * @param {*} event
   * @param {*} env
   * @param {*} ctx
   */
  async scheduled(event, env, ctx) {
    const scheduledDate = new Date(event.scheduledTime);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(scheduledDate);
    const weekday = parts.find((p) => p.type === 'weekday').value;
    const hour = Number(parts.find((p) => p.type === 'hour').value);

    // Almost every hourly tick lands here and returns immediately - only the
    // one Monday 9am America/New_York tick per week proceeds.
    if (weekday !== 'Mon' || hour !== 9) return;

    ctx.waitUntil(
      (async () => {
        const recap = await buildWeeklyRecap(env, scheduledDate);
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
