/**
 * Adobe I/O Runtime Action: Get IMS Access Token
 *
 * This action generates an OAuth 2.0 access token using the client credentials flow.
 * The token is used to authenticate requests to the AEM Dynamic Media Delivery API.
 *
 * Environment Variables (set via .env or aio CLI):
 * - IMS_CLIENT_ID: Adobe IMS Client ID
 * - IMS_CLIENT_SECRET: Adobe IMS Client Secret
 * - IMS_SCOPES: Comma-separated scopes (e.g., openid,AdobeID,aem.assets.delivery)
 */

const fetch = require('node-fetch');

// Adobe IMS Token Endpoint
const IMS_TOKEN_ENDPOINT = 'https://ims-na1.adobelogin.com/ims/token/v3';

// Note: CORS headers are automatically handled by I/O Runtime for web actions
// Do NOT add custom CORS headers as it causes duplicate header issues

/**
 * Main action handler
 * @param {Object} params - Action parameters
 * @returns {Object} Response with access token or error
 */
async function main(params) {
  // Hardcoded credentials (for simplicity - in production, use environment variables)
  const clientId = 'aee68698a2774e93b7cbc30eb9be46cf';
  const clientSecret = 'p8e-3z_UtzEOIb4Iz8WOBoPJhNMRuXiBrlcK';
  const scopes = params.IMS_SCOPES || 'openid,AdobeID,aem.assets.delivery';
  const logLevel = params.LOG_LEVEL || 'info';

  try {
    if (logLevel === 'debug') {
      console.log('[get-token] Requesting token from IMS...');
    }

    // Build form data for token request
    const formData = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: scopes,
    });

    // Request token from Adobe IMS
    const response = await fetch(IMS_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[get-token] IMS token request failed:', data);
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          error: 'Token request failed',
          message: data.error_description || data.error || 'Unknown error',
          details: data,
        },
      };
    }

    if (logLevel === 'debug') {
      console.log('[get-token] Token obtained successfully');
    }

    // Return the access token (and other relevant info)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
      body: {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in,
        // Include expiration timestamp for client-side caching
        expires_at: Date.now() + (data.expires_in * 1000),
      },
    };
  } catch (error) {
    console.error('[get-token] Error:', error.message);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        error: 'Internal error',
        message: error.message,
      },
    };
  }
}

exports.main = main;
