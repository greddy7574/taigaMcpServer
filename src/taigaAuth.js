import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Taiga API configuration
const TAIGA_API_URL = process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1';

// Store the auth token
let authToken = null;
let tokenExpiration = null;

// Taiga throttles repeated auth attempts, so back off briefly after a failed
// authentication instead of retrying /auth on every subsequent call.
const AUTH_BACKOFF_MS = 10 * 1000;
let authCooldownUntil = 0;

/**
 * Authenticate with Taiga API and get an auth token
 * @param {string} username - Taiga username or email
 * @param {string} password - Taiga password
 * @returns {Promise<string>} - Auth token
 */
export async function authenticate(username, password) {
  if (Date.now() < authCooldownUntil) {
    throw new Error('Taiga authentication failed recently, please retry in a few seconds');
  }
  try {
    const response = await axios.post(`${TAIGA_API_URL}/auth`, {
      type: 'normal',
      username,
      password
    });

    authToken = response.data.auth_token;
    // Set token expiration to 24 hours from now
    tokenExpiration = Date.now() + 24 * 60 * 60 * 1000;
    authCooldownUntil = 0;

    return authToken;
  } catch (error) {
    authCooldownUntil = Date.now() + AUTH_BACKOFF_MS;
    console.error('Authentication failed:', error.message);
    throw new Error('Failed to authenticate with Taiga');
  }
}

/**
 * Invalidate the cached auth token so the next request re-authenticates
 * @returns {void}
 */
export function invalidateAuthToken() {
  authToken = null;
  tokenExpiration = null;
}

/**
 * Get the current auth token, refreshing if necessary
 * @returns {Promise<string>} - Auth token
 */
export async function getAuthToken() {
  // If token doesn't exist or is expired, authenticate again
  if (!authToken || Date.now() > tokenExpiration) {
    const username = process.env.TAIGA_USERNAME;
    const password = process.env.TAIGA_PASSWORD;

    if (!username || !password) {
      throw new Error('Taiga credentials not found in environment variables');
    }

    await authenticate(username, password);
  }

  return authToken;
}

/**
 * Create an axios instance with auth headers.
 * Retries the request once with a fresh token if the API responds 401
 * (the cached token was invalidated server-side).
 * @returns {Promise<import('axios').AxiosInstance>} - Axios instance with auth headers
 */
export async function createAuthenticatedClient() {
  const token = await getAuthToken();

  const client = axios.create({
    baseURL: TAIGA_API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const config = error?.config;
      if (status === 401 && config && !config.__retriedAuth) {
        console.error('Taiga API returned 401, refreshing auth token and retrying once');
        invalidateAuthToken();
        try {
          const freshToken = await getAuthToken();
          config.__retriedAuth = true;
          config.headers = {
            ...(config.headers ?? {}),
            'Authorization': `Bearer ${freshToken}`
          };
          return axios.request(config);
        } catch (reauthError) {
          console.error('Re-authentication after 401 failed:', reauthError.message);
        }
      }
      throw error;
    }
  );

  return client;
}
