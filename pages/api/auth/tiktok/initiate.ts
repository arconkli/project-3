import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[${new Date().toISOString()}] Received request for /api/auth/tiktok/initiate`);
  if (req.method !== 'GET') {
    console.log(`[${new Date().toISOString()}] Method not allowed: ${req.method}`);
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log(`[${new Date().toISOString()}] Entering try block...`);
    // 1. Generate State
    console.log(`[${new Date().toISOString()}] Attempting crypto.randomUUID()...`);
    const state = crypto.randomUUID();
    console.log(`[${new Date().toISOString()}] State generated: ${state}`);

    // 2. Get Env Vars
    console.log(`[${new Date().toISOString()}] Reading environment variables...`);
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
    const callbackBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log(`[${new Date().toISOString()}] Client Key found: ${!!clientKey}, Base URL: ${callbackBaseUrl}`);

    if (!clientKey) {
      console.error('[ERROR] Missing NEXT_PUBLIC_TIKTOK_CLIENT_KEY in server environment variables.');
      // Sending JSON error back to client
      return res.status(500).json({ error: 'TikTok integration is not configured correctly (server).' });
    }

    // 3. Construct URL
    console.log(`[${new Date().toISOString()}] Constructing TikTok URL...`);
    const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    tiktokAuthUrl.searchParams.append('client_key', clientKey);
    tiktokAuthUrl.searchParams.append('scope', 'user.info.basic');
    tiktokAuthUrl.searchParams.append('response_type', 'code');
    tiktokAuthUrl.searchParams.append('redirect_uri', `${callbackBaseUrl}/api/auth/callback/tiktok`);
    tiktokAuthUrl.searchParams.append('state', state);

    console.log(`[${new Date().toISOString()}] Generated TikTok Auth URL on server:`, tiktokAuthUrl.toString());

    // 4. Send Response
    console.log(`[${new Date().toISOString()}] Sending success JSON response...`);
    res.status(200).json({ authUrl: tiktokAuthUrl.toString(), state });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] [ERROR] Caught error in API route /api/auth/tiktok/initiate:`, error);
    console.log(`[${new Date().toISOString()}] Sending error JSON response...`);
    // Ensure a JSON error response is sent to the client even on crash
    if (!res.headersSent) {
        res.status(500).json({ error: `Failed to initiate TikTok connection: ${error.message || 'Unknown server error'}` });
    } else {
        console.error('[ERROR] Headers already sent, cannot send JSON error response.')
    }
  }
} 