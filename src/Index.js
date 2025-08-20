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
    const urls = formDataMap.get('URLs');

    console.log('payload - ', payload);
    console.log('ruleBroken: ', formDataMap.get('ruleBroken'));

    if (
      formDataMap.get('ruleBroken') === false &&
      acceptedPayloads.includes(payloadType)
    ) {
      for (const { url, embeds } of urls) {
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

        await sendWithRateLimit(url, formData);
      }
    }

    return new Response();
  },
};

async function sendWithRateLimit(url, formData) {
  let response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (response.status === 429) {
    const retryAfter = parseFloat(response.headers.get('Retry-After')) || 1;
    console.log(`Rate limited by Discord. Retrying after ${retryAfter}s...`);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return sendWithRateLimit(url, formData); // ✅ Retry after waiting
  }

  if (!response.ok) {
    console.log(`Failed to send: ${response.status}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 400)); // ~5 requests per 2 seconds
}
