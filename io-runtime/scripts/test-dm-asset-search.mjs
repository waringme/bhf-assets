#!/usr/bin/env node
/**
 * Smoke-test POST /adobe/assets/search (activated assets) using IMS client credentials.
 *
 * Required env (e.g. in io-runtime/.env for local runs, or export in shell):
 *   DM_DELIVERY_URL   — e.g. https://delivery-pXXXX-eYYYY.adobeaemcloud.com
 *   IMS_CLIENT_ID     — OAuth Server-to-Server client ID (same value as X-Api-Key)
 *   IMS_CLIENT_SECRET
 *
 * Optional:
 *   IMS_SCOPES        — default: openid,AdobeID,aem.assets.delivery
 *
 * Usage:
 *   cd io-runtime && node scripts/test-dm-asset-search.mjs [search text] [limit]
 *
 * @see https://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/assets/delivery/#operation/search
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMS_TOKEN_ENDPOINT = 'https://ims-na1.adobelogin.com/ims/token/v3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv(path.join(__dirname, '..', '.env'));

function buildSearchBody(searchText, limit) {
  const fields = [
    'metadata.repositoryMetadata.repo:name',
    'metadata.assetMetadata.dc:title',
    'metadata.assetMetadata.autogen:title',
    'metadata.assetMetadata.autogen:description',
    'metadata.assetMetadata.autogen:subject',
  ];
  return {
    query: [
      {
        match: {
          text: searchText || ' ',
          fields,
        },
      },
    ],
    limit,
  };
}

async function getImsToken(clientId, clientSecret, scopes) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: scopes,
  });
  const res = await fetch(IMS_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error_description || data.error || res.statusText;
    throw new Error(`IMS token failed (${res.status}): ${msg}`);
  }
  if (!data.access_token) {
    throw new Error('IMS response missing access_token');
  }
  return data.access_token;
}

async function main() {
  const deliveryUrl = (process.env.DM_DELIVERY_URL || '').replace(/\/+$/, '');
  const clientId = process.env.IMS_CLIENT_ID;
  const clientSecret = process.env.IMS_CLIENT_SECRET;
  const scopes = process.env.IMS_SCOPES || 'openid,AdobeID,aem.assets.delivery';
  const searchText = process.argv[2] ?? ' ';
  const limit = Math.min(50, Math.max(1, Number(process.argv[3]) || 5));

  if (!deliveryUrl || !clientId || !clientSecret) {
    console.error(`Missing env. Set:
  DM_DELIVERY_URL   (e.g. https://delivery-pXXXX-eYYYY.adobeaemcloud.com)
  IMS_CLIENT_ID
  IMS_CLIENT_SECRET

Optional: IMS_SCOPES (default: ${scopes})

Add them to io-runtime/.env or export before running.`);
    process.exit(1);
  }

  const searchUrl = `${deliveryUrl}/adobe/assets/search`;
  const token = await getImsToken(clientId, clientSecret, scopes);
  const payload = buildSearchBody(searchText, limit);

  const res = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Api-Key': clientId,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error(`Search failed HTTP ${res.status}`);
    console.error(text.slice(0, 2000));
    process.exit(1);
  }

  const total = json?.search_metadata?.totalCount?.total;
  const results = json?.hits?.results ?? [];
  console.log(`OK ${res.status} — totalCount: ${total ?? '(not in response)'} — returned: ${results.length}`);
  if (results.length > 0) {
    const sample = results[0];
    const id = sample?.id || sample?._path || sample?.['repo:assetId'];
    console.log('First hit id/path:', id ?? JSON.stringify(Object.keys(sample || {})));
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
