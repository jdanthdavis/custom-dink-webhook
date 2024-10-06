import { createFormData } from './utils.js';
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
    let msgMap;

    console.log('payload - ', payload);

    if (acceptedPayloads.includes(payloadType)) {
      msgMap = createFormData(extra, payloadType, playerName, env);

      for (const [url, msg] of msgMap.entries()) {
        let formData = new FormData();
        let response;
        formData.append('payload_json', JSON.stringify({ content: msg }));
        if (file !== null) {
          // since the screenshots would be taken so close to each other we are fine with sending the first one twice
          formData.append('file', file);
        }

        try {
          response = await fetch(url.URL, {
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

const makeid = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
  for (let i = 0; i < length; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const buildMetadataFromHeaders = (headers) => {
  const responseMetadata = {};
  Array.from(headers).forEach(([key, value]) => {
    responseMetadata[key.replace(/-/g, '_')] = value;
  });
  return responseMetadata;
};

const WORKER_ID = makeid(6);

async function handleRequest(event) {
  const { request } = event;
  const rMeth = request.method;
  const rUrl = request.url;
  const uAgent = request.headers.get('user-agent');
  const rHost = request.headers.get('host');
  const cfRay = request.headers.get('cf-ray');
  const cIP = request.headers.get('cf-connecting-ip');
  const rCf = request.cf;

  const requestMetadata = buildMetadataFromHeaders(request.headers);

  const sourceKey = '';
  const apiKey = '';

  const t1 = Date.now();
  const response = await fetch(request);
  const originTimeMs = Date.now() - t1;

  const statusCode = response.status;

  const responseMetadata = buildMetadataFromHeaders(response.headers);

  const logEntry = `${rMeth} | ${statusCode} | ${cIP} | ${cfRay} | ${rUrl} | ${uAgent}`;

  const logflareEventBody = {
    source: sourceKey,
    log_entry: logEntry,
    metadata: {
      response: {
        headers: responseMetadata,
        origin_time: originTimeMs,
        status_code: response.status,
      },
      request: {
        url: rUrl,
        method: rMeth,
        headers: requestMetadata,
        cf: rCf,
      },
      logflare_worker: {
        worker_id: WORKER_ID,
      },
    },
  };

  const init = {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
      'User-Agent': `Cloudflare Worker via ${rHost}`,
    },
    body: JSON.stringify(logflareEventBody),
  };

  event.waitUntil(fetch('https://api.logflare.app/logs', init));

  return response;
}

addEventListener('fetch', (event) => {
  event.passThroughOnException();

  event.respondWith(handleRequest(event));
});
