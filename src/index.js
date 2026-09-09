import createFormData from './createFormData.js';
import { acceptedPayloads, theBoys } from './constants.js';
import sendDiscordMessage from './sendDiscordMessage.js';
import buildWeeklyRecap from './recapHandler.js';

// Chat commands that reply with a leaderboard table rather than reacting to
// the triggering event — a screenshot attached to the original request (if
// any) shouldn't be tacked onto these replies.
const LEADERBOARD_COMMANDS = ['!Fetchpets', '!Fetchloot'];

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

      const isLeaderboardReply = LEADERBOARD_COMMANDS.some((command) =>
        extra?.message?.startsWith(command)
      );

      for (const [url, msg] of msgMap.entries()) {
        console.log(url, msg);
        // since the screenshots would be taken so close to each other we are fine with sending the first one twice
        await sendDiscordMessage(
          url.URL,
          msg,
          file !== null && !isLeaderboardReply ? file : null
        );
      }
    }
    return new Response();
  },

  /**
   * Posts the weekly recap on the configured Cron Trigger schedule.
   * @param {*} event - The scheduled event
   * @param {*} env - The Worker's environment bindings (URLs/secrets)
   * @param {*} ctx - The execution context
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        const recap = await buildWeeklyRecap(env);
        if (recap) {
          await sendDiscordMessage(env.RECAP_URL, recap);
        }
      })()
    );
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
