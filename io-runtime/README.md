# Adobe I/O Runtime Actions for Sage Portal

This folder contains Adobe I/O Runtime actions for secure server-side operations, specifically for generating OAuth tokens for the AEM Dynamic Media Delivery API.

## Actions

### `get-token`

Generates an OAuth 2.0 access token using the Adobe IMS client credentials flow. This action securely stores your client credentials and provides a token endpoint that the frontend can call without exposing secrets.

**Endpoint:** `https://<namespace>.adobeioruntime.net/api/v1/web/sage-portal/get-token`

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86399,
  "expires_at": 1234567890123
}
```

## Prerequisites

1. **Adobe Developer Console Project** with:
   - AEM Dynamic Media API enabled
   - OAuth Server-to-Server credentials configured
   - I/O Runtime enabled

2. **Adobe I/O CLI** installed:
   ```bash
   npm install -g @adobe/aio-cli
   ```

3. **Login to Adobe I/O:**
   ```bash
   aio login
   ```

## Setup

1. **Navigate to this folder:**
   ```bash
   cd io-runtime
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file from template:**
   ```bash
   cp env.template .env
   ```

4. **Edit `.env` with your credentials:**
   ```env
   # From Adobe Developer Console > Project > OAuth Server-to-Server
   IMS_CLIENT_ID=your_client_id
   IMS_CLIENT_SECRET=your_client_secret
   IMS_SCOPES=openid,AdobeID,aem.assets.delivery

   # From Adobe Developer Console > Project > Runtime
   AIO_runtime_auth=your_auth_code
   AIO_runtime_namespace=your_namespace
   ```

## Deployment

1. **Select your Adobe I/O project:**
   ```bash
   aio app use
   ```

2. **Deploy the actions:**
   ```bash
   aio app deploy
   ```

3. **Get the deployed action URL:**
   ```bash
   aio app get-url
   ```

   The URL will look like:
   ```
   https://<namespace>.adobeioruntime.net/api/v1/web/sage-portal/get-token
   ```

4. **Update the Asset Search block configuration** in Universal Editor with the Runtime endpoint URL.

## Testing

Test the deployed action:

```bash
curl https://<namespace>.adobeioruntime.net/api/v1/web/sage-portal/get-token
```

Or test locally:

```bash
aio app run
```

## Security Notes

- **Never commit `.env` files** - they contain secrets
- The `client_secret` is stored securely in I/O Runtime and never exposed to the browser
- Tokens are generated on-demand and cached by the client for their validity period (24 hours)
- CORS headers are configured to allow browser access

## Troubleshooting

### "IMS credentials not configured"
- Ensure `.env` file exists with valid `IMS_CLIENT_ID` and `IMS_CLIENT_SECRET`
- Redeploy after updating `.env`: `aio app deploy`

### "Token request failed"
- Verify your OAuth Server-to-Server credentials in Adobe Developer Console
- Ensure the credentials have the required scopes
- Check that the AEM Dynamic Media API is added to your project

### CORS errors
- The action includes CORS headers by default
- If you need to restrict origins, modify the `CORS_HEADERS` in `get-token.js`
