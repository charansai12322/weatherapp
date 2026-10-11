/**
 * Centralized API client for Weather AI.
 * Connects directly to the FastAPI backend.
 * Never stores or transmits external third-party API keys.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * Checks the live status of the backend service.
 * @returns {Promise<{ ok: boolean, data?: { status: string }, error?: string }>}
 */
export async function checkBackendHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, error: `Backend returned HTTP ${response.status}` };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      error: err.name === 'AbortError'
        ? 'Connection check timed out'
        : 'Cannot reach backend server',
    };
  }
}

/**
 * Submits a weather inquiry to the Weather Agent.
 * @param {string} query
 * @returns {Promise<string>} The agent's synthesized response text.
 */
export async function askWeather(query) {
  if (!query || !query.trim()) {
    throw new Error('Please enter a city or question about the weather.');
  }

  const controller = new AbortController();
  // 35s timeout to handle potential Groq two-turn tool roundtrips gracefully
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: query.trim() }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Service request failed (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // Fallback to generic status text
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data || typeof data.response !== 'string') {
      throw new Error('Invalid response received from Weather Agent.');
    }

    return data.response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The weather agent took too long to respond.');
    }
    throw err;
  }
}
