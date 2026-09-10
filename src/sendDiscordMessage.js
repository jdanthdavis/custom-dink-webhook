/**
 * Posts a message to a Discord webhook, retrying once on a 429 rate-limit.
 * @param {string} url
 * @param {string} content
 * @param {FormDataEntryValue | null} [file] - optional screenshot attachment
 * @returns {Promise<Response|undefined>}
 */
async function sendDiscordMessage(url, content, file = null) {
  const formData = new FormData();
  formData.append('payload_json', JSON.stringify({ content }));
  if (file !== null) {
    formData.append('file', file);
  }

  let response;
  try {
    response = await fetch(url, { method: 'post', body: formData });

    if (response.status === 429) {
      const retryBody = await response
        .clone()
        .json()
        .catch(() => null);
      const retryAfterSeconds =
        Number(retryBody?.retry_after ?? response.headers.get('Retry-After')) ||
        1;
      console.log(`Rate limited, retrying after ${retryAfterSeconds}s`);
      await new Promise((resolve) =>
        setTimeout(resolve, retryAfterSeconds * 1000)
      );
      response = await fetch(url, { method: 'post', body: formData });
    }
  } catch (error) {
    console.log('There was an error - ', error);
  }

  if (!response?.ok) {
    console.log(`Response Code: ${response?.status}`);
  }

  return response;
}

export default sendDiscordMessage;
