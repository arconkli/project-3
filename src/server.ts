import express from 'express';
import crypto from 'crypto';
import type { Request, Response } from 'express'; // Import Express types
import cookieParser from 'cookie-parser'; // Import cookie-parser
import { TikTokService } from './services/tiktok/TikTokService'; // Import TikTokService
import { loadEnv } from 'vite'; // Import loadEnv from Vite

// Load environment variables - Rely on Vite's loading mechanism

// Access the variable using the exact name defined in .env.local
// Read Client Key at top level as it seemed okay, but we will re-check in handler
// const TIKTOK_CLIENT_KEY_FROM_ENV = process.env.VITE_PUBLIC_TIKTOK_CLIENT_KEY;
// DO NOT read redirect URI or base URL here anymore.
// const TIKTOK_REDIRECT_URI = process.env.VITE_PUBLIC_TIKTOK_REDIRECT_URI;
// const FRONTEND_BASE_URL = process.env.VITE_PUBLIC_APP_URL;

// Create the Express app
const app = express();

// Helper function to Base64 URL encode a buffer
function base64URLEncode(str: Buffer): string {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Helper function to SHA256 hash a string
function sha256(buffer: string): Buffer {
    return crypto.createHash('sha256').update(buffer).digest();
}

// Use cookie-parser middleware
app.use(cookieParser());

// Middleware for parsing JSON bodies (optional, but good practice for future POST routes)
app.use(express.json());

// --- Define API Routes Here ---

// GET /api/auth/tiktok/initiate
app.get('/api/auth/tiktok/initiate', (req: Request, res: Response) => {
  console.log('--- Executing /api/auth/tiktok/initiate (Express handler) ---');

  // Load environment variables *inside* the handler using loadEnv
  const mode = process.env.NODE_ENV || 'development'; // Get current mode
  const env = loadEnv(mode, process.cwd(), ''); // Load all env vars
  const clientKey = env.VITE_PUBLIC_TIKTOK_CLIENT_KEY;
  const redirectUri = env.VITE_PUBLIC_TIKTOK_REDIRECT_URI;

  // --- BEGIN ADDED DEBUG --- 
  console.log(`[Initiate Handler] Mode: ${mode}`);
  // console.log('[Initiate Handler] All loaded env:', env); // Optional: Log all loaded vars for deep debug
  console.log('[Initiate Handler] Reading Vars From loadedEnv:', { clientKey, redirectUri }); 
  // --- END ADDED DEBUG --- 

  // Check variables loaded via loadEnv
  if (!clientKey) {
    console.error('TikTok client key (VITE_PUBLIC_TIKTOK_CLIENT_KEY) not found via loadEnv.');
    return res.status(500).json({ error: 'Server configuration error: TikTok client key missing.' });
  }
  if (!redirectUri) {
    console.error('TikTok redirect URI (VITE_PUBLIC_TIKTOK_REDIRECT_URI) not found via loadEnv.');
     return res.status(500).json({ error: 'Server configuration error: TikTok redirect URI missing.' });
  }

  try {
    // 1. Generate State for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // 2. Generate PKCE code_verifier and code_challenge
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = base64URLEncode(sha256(codeVerifier));

    // 3. Construct TikTok OAuth URL using variables from loadEnv
    const scope = 'user.info.basic';
    const params = new URLSearchParams({
      client_key: clientKey, 
      response_type: 'code',
      scope: scope,
      redirect_uri: redirectUri, 
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;

    console.log(`Generated TikTok Auth URL: ${authUrl}`);
    console.log(`Generated state: ${state}`);
    // console.log(`Generated code_verifier: ${codeVerifier}`); // Don't log verifier in production

    // 4. Set state and code_verifier in secure cookies
    const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 600 * 1000, // 10 minutes in milliseconds
        sameSite: 'lax' as const, // Explicitly type sameSite
    };
    res.cookie('tiktok_oauth_state', state, cookieOptions);
    res.cookie('tiktok_code_verifier', codeVerifier, cookieOptions); // Store code verifier

    // 5. Return JSON response
    res.json({ authUrl, state }); // Return state too, client might still use it for initial check

  } catch (error) {
    console.error('Error generating TikTok auth URL:', error);
    // Check if headers already sent before sending response
    if (!res.headersSent) {
        return res.status(500).json({ error: 'Internal server error generating TikTok auth URL.' });
    } else {
        console.error('Headers already sent, cannot send error response.');
    }
  }
});

// GET /api/auth/tiktok/callback
app.get('/api/auth/tiktok/callback', async (req: Request, res: Response) => {
    console.log('--- Executing /api/auth/tiktok/callback (Express handler) ---');

    // Load FRONTEND_BASE_URL inside the handler using loadEnv
    const mode = process.env.NODE_ENV || 'development';
    const env = loadEnv(mode, process.cwd(), '');
    const frontendBaseUrl = env.VITE_PUBLIC_APP_URL;

    console.log(`[Callback Handler] Mode: ${mode}`);
    // console.log('[Callback Handler] All loaded env:', env);
    console.log('[Callback Handler] Reading Vars From loadedEnv:', { frontendBaseUrl });

    if (!frontendBaseUrl) {
        console.error('Frontend base URL (VITE_PUBLIC_APP_URL) not found via loadEnv.');
        // Cannot redirect without a base URL, send an error response instead
        return res.status(500).send('Server configuration error: Frontend URL missing.');
    }

    const { code, state } = req.query;
    const storedState = req.cookies.tiktok_oauth_state;
    const codeVerifier = req.cookies.tiktok_code_verifier;

    // Clear cookies immediately after reading them
    res.clearCookie('tiktok_oauth_state', { path: '/' });
    res.clearCookie('tiktok_code_verifier', { path: '/' });

    // 1. Validate State
    if (!state || state !== storedState) {
        console.error('TikTok Callback Error: Invalid state parameter.', { received: state, expected: storedState });
        return res.redirect(`${frontendBaseUrl}/settings?error=invalid_state`);
    }

    // 2. Check for code
    if (!code || typeof code !== 'string') {
        console.error('TikTok Callback Error: No authorization code found.');
        return res.redirect(`${frontendBaseUrl}/settings?error=tiktok_connection_failed&message=no_code`);
    }

    // 3. Check for code verifier
    if (!codeVerifier) {
        console.error('TikTok Callback Error: Missing code verifier cookie.');
        return res.redirect(`${frontendBaseUrl}/settings?error=tiktok_connection_failed&message=missing_verifier`);
    }

    try {
        console.log('State validated. Exchanging code for token...');
        // TikTokService constructor reads its own env vars, assuming that works now
        const tiktokService = new TikTokService(); 

        // 4. Exchange code for tokens using the service
        const tokenResponse = await tiktokService.exchangeCodeForToken(code, codeVerifier);
        console.log('TikTok tokens obtained:', { open_id: tokenResponse.open_id }); // Log success, avoid logging tokens

        // TODO: Add logic here (Supabase user, Vault, DB upsert)

        // 5. Redirect on success
        console.log('Redirecting to settings page (success).');
        return res.redirect(`${frontendBaseUrl}/settings?success=tiktok_connected`);

    } catch (error: any) {
        console.error('Error during TikTok OAuth callback token exchange:', error);
        const errorMessage = encodeURIComponent(error.message || 'Unknown error during token exchange');
        console.log(`Redirecting to settings page (error): ${errorMessage}`);
        return res.redirect(`${frontendBaseUrl}/settings?error=tiktok_connection_failed&message=${errorMessage}`);
    }
});

// --- Add other API routes here in the future ---
// e.g., app.post('/api/auth/tiktok/callback', ...) 


// Export the app to be used as middleware
export { app }; 