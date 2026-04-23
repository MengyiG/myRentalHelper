const API_URL = 'https://api.anthropic.com/v1/messages';

function buildExtractionPrompt(chatText) {
  return `You are a rental listing extractor. Extract ALL rental property listings from the following conversation between a user and real estate agents.

Return ONLY a valid JSON array (no markdown, no explanation). Each object must have exactly these fields:
{
  "id": "L1",           // Unique ID: use agent initials + number if clear, else L1/L2...
  "agent": "Name",      // Agent's name
  "address": "Full address with city, state/province", // Complete as much as possible
  "type": "1B1B",       // Unit type: Studio / 1B1B / 2B1B / 2B2B / 3B2B etc.
  "price": 2000,        // Monthly rent lower bound (number, no symbols)
  "priceMax": null,     // Upper bound if a price range is mentioned, else null
  "includesUtilities": false, // true if rent includes water/electricity
  "amenities": ["In-unit W/D", "Gym", "Doorman", "Parking"], // Array of strings
  "pros": ["Near transit"],   // Advantages mentioned
  "cons": ["No parking"],     // Disadvantages mentioned
  "moveInDate": "2024-03-01", // ISO date or descriptive string
  "description": "Brief summary of the listing"
}

If no clear listings are found, return [].

Chat conversation:
---
${chatText}
---`;
}

function buildSingleExtractionPrompt(text) {
  return `You are a rental listing extractor. From the text below, extract ONE rental listing and return ONLY a valid JSON object (no markdown, no explanation).

Fields:
{
  "agent": "agent name or empty string",
  "address": "full address with city and state, complete as much as possible",
  "type": "Studio / 1B1B / 2B1B / 2B2B / 3B2B or empty string",
  "price": number or null,
  "priceMax": number or null,
  "includesUtilities": boolean,
  "amenities": ["array of strings"],
  "pros": ["array of strings"],
  "cons": ["array of strings"],
  "moveInDate": "date string or empty string",
  "description": "brief summary"
}

Text:
---
${text}
---`;
}

export async function parseClipboardListing(apiKey, text) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildSingleExtractionPrompt(text) }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text ?? '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

export async function extractListings(apiKey, chatText) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildExtractionPrompt(chatText) }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';

  // Robustly parse JSON array from response
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array in response');
  return JSON.parse(match[0]);
}
