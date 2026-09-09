/**
 * Posts a message to a Discord webhook URL, retrying once if rate-limited
 * (HTTP 429), honoring Discord's requested retry_after delay.
 * @param {string} url - The Discord webhook URL
 * @param {string} content - The message content to send
 * @param {FormDataEntryValue | null} [file] - An optional screenshot attachment
 * @returns {Promise<Response|undefined>} The final response, or undefined if the request threw
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
      const retryBody = await response.clone().json().catch(() => null);
      const retryAfterSeconds =
        Number(retryBody?.retry_after ?? response.headers.get('Retry-After')) || 1;
      console.log(`Rate limited, retrying after ${retryAfterSeconds}s`);
      await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
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
