import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parsers
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // ==========================================
  // Strava Integration API Endpoints
  // ==========================================

  // 1. Get Strava Configuration & Redirect URI
  app.get('/api/strava/config', (req: Request, res: Response) => {
    const rawClientId = process.env.STRAVA_CLIENT_ID || process.env.CLIENT_ID || '';
    const appUrl =
      process.env.APP_URL ||
      `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/callback`;

    res.json({
      configured: Boolean(rawClientId),
      clientId: rawClientId,
      appUrl,
      redirectUri,
    });
  });

  // 2. Generate Strava Authorization URL for OAuth Popup
  app.get('/api/strava/auth-url', (req: Request, res: Response) => {
    const clientId =
      (req.query.client_id as string) ||
      process.env.STRAVA_CLIENT_ID ||
      process.env.CLIENT_ID;

    if (!clientId) {
      return res.status(400).json({
        error: 'Missing Strava Client ID. Please configure STRAVA_CLIENT_ID or provide client_id parameter.',
      });
    }

    const appUrl =
      process.env.APP_URL ||
      `${req.protocol}://${req.get('host')}`;
    const redirectUri = (req.query.redirect_uri as string) || `${appUrl}/auth/callback`;
    const scope = (req.query.scope as string) || 'read,activity:read,activity:read_all';
    const approvalPrompt = (req.query.approval_prompt as string) || 'force';

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${encodeURIComponent(
      String(clientId)
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=${encodeURIComponent(
      approvalPrompt
    )}&scope=${encodeURIComponent(scope)}`;

    res.json({
      url: authUrl,
      redirectUri,
      clientId,
    });
  });

  // 3. OAuth Callback Handler (Popup receiver via postMessage)
  const handleCallback = async (req: Request, res: Response) => {
    const { code, error, scope } = req.query;

    if (error || !code) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Strava Authentication Failed</title></head>
          <body style="font-family: sans-serif; background: #0f172a; color: #f87171; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; padding: 24px; background: #1e293b; border-radius: 16px; border: 1px solid #334155;">
              <h2 style="margin-top: 0;">Authorization Canceled or Failed</h2>
              <p style="color: #94a3b8; font-size: 14px;">${error ? String(error) : 'No authorization code received from Strava.'}</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error || 'missing_code'}' }, '*');
                  setTimeout(() => window.close(), 1500);
                }
              </script>
            </div>
          </body>
        </html>
      `);
    }

    // Check if user granted activity reading permission
    const grantedScope = String(scope || '');
    const hasActivityScope =
      grantedScope.includes('activity:read') || grantedScope.includes('activity:read_all');

    const clientId = process.env.STRAVA_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET || process.env.CLIENT_SECRET;

    if (!hasActivityScope) {
      const appHost = req.protocol + '://' + req.get('host');
      const retryUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId || ''}&redirect_uri=${encodeURIComponent(
        appHost + '/auth/callback'
      )}&response_type=code&approval_prompt=force&scope=read,activity:read,activity:read_all`;

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Strava Permission Required</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #0f172a;
                color: #f8fafc;
                margin: 0;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                box-sizing: border-box;
              }
              .card {
                background-color: #1e293b;
                border: 1px solid #f59e0b;
                border-radius: 16px;
                padding: 28px 24px;
                max-width: 440px;
                text-align: center;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
              }
              .badge {
                width: 52px;
                height: 52px;
                background-color: rgba(245, 158, 11, 0.15);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 14px;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 26px;
              }
              h2 {
                color: #fbbf24;
                margin: 0 0 10px 0;
                font-size: 19px;
                font-weight: 700;
              }
              p {
                color: #cbd5e1;
                font-size: 13px;
                line-height: 1.6;
                margin: 0 0 16px 0;
              }
              .highlight-box {
                background-color: #0f172a;
                border: 1px solid rgba(245, 158, 11, 0.4);
                color: #fbbf24;
                padding: 6px 12px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
                margin: 6px 0 14px 0;
                display: inline-block;
              }
              .btn-primary {
                display: block;
                width: 100%;
                background-color: #fc4c02;
                color: white;
                text-decoration: none;
                padding: 12px 18px;
                border-radius: 10px;
                font-weight: 700;
                font-size: 13px;
                border: none;
                cursor: pointer;
                box-sizing: border-box;
                margin-bottom: 8px;
              }
              .btn-primary:hover {
                background-color: #e34402;
              }
              .btn-secondary {
                display: block;
                width: 100%;
                background-color: transparent;
                color: #94a3b8;
                text-decoration: none;
                padding: 10px 16px;
                border-radius: 10px;
                font-size: 12px;
                border: 1px solid #334155;
                cursor: pointer;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">⚠️</div>
              <h2>Activity Permission Missing</h2>
              <p>
                When connecting to Strava, the required permission checkbox was not checked:
              </p>
              <div class="highlight-box">
                ☑ View data about your activities
              </div>
              <p>
                Strava will not allow PeakPulse to access or sync your running logs without this permission enabled.
              </p>
              <a href="${retryUrl}" class="btn-primary">
                ⚡ Re-authorize & Check the Box
              </a>
              <button onclick="window.close()" class="btn-secondary">
                Close & Use File Upload
              </button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_ERROR',
                  error: 'Strava activity permission not granted. When the Strava screen appears, please check the box: ☑ View data about your activities.'
                }, '*');
              }
            </script>
          </body>
        </html>
      `);
    }

    try {
      if (!clientId || !clientSecret) {
        // Return code directly to parent window so client can exchange if credentials are provided in UI
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head><title>Strava Code Received</title></head>
            <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
              <div style="text-align: center; padding: 24px; background: #1e293b; border-radius: 16px; border: 1px solid #334155;">
                <h2 style="color: #fc4c02; margin-top: 0;">Strava Connected</h2>
                <p style="color: #94a3b8; font-size: 14px;">Returning authorization code to PeakPulse...</p>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'STRAVA_CODE_RECEIVED',
                      code: '${String(code)}',
                      scope: '${grantedScope}'
                    }, '*');
                    setTimeout(() => window.close(), 500);
                  } else {
                    window.location.href = '/';
                  }
                </script>
              </div>
            </body>
          </html>
        `);
      }

      // Exchange code for token with Strava API
      const tokenRes = await fetch('https://www.strava.com/api/v3/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: String(code),
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        throw new Error(tokenData.message || 'Strava token exchange failed');
      }

      // Test whether this token can access athlete activities or if Strava developer restrictions apply
      let canReadActivities = true;
      let restrictionReason = null;
      try {
        const testRes = await fetch(
          'https://www.strava.com/api/v3/athlete/activities?page=1&per_page=1',
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          }
        );
        canReadActivities = testRes.ok;
        if (!testRes.ok) {
          const testErr = await testRes.json().catch(() => ({}));
          console.warn('Strava activity test check status:', testRes.status, testErr);
          if (testRes.status === 403) {
            restrictionReason = 'restricted_403';
          }
        }
      } catch {
        canReadActivities = false;
        restrictionReason = 'network_error';
      }

      // Send token and athlete data back to main app window
      tokenData.canReadActivities = canReadActivities;
      tokenData.restrictionReason = restrictionReason;
      tokenData.scope = grantedScope;
      const safePayload = JSON.stringify(tokenData);

      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Strava Connected Successfully</title></head>
          <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; padding: 24px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; max-width: 400px;">
              <div style="width: 48px; height: 48px; background: #fc4c02; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; color: white;">
                ⚡
              </div>
              <h2 style="margin: 0 0 8px 0; color: #f8fafc; font-size: 18px;">Strava Connected!</h2>
              <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Synchronizing your activities with PeakPulse Korea...</p>
              <div style="font-size: 12px; color: #64748b;">This window will close automatically.</div>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    payload: ${safePayload}
                  }, '*');
                  setTimeout(() => window.close(), 600);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Error in Strava callback:', err);
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Strava Token Exchange Error</title></head>
          <body style="font-family: sans-serif; background: #0f172a; color: #f87171; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; padding: 24px; background: #1e293b; border-radius: 16px; border: 1px solid #334155;">
              <h2 style="margin-top: 0;">Token Exchange Failed</h2>
              <p style="color: #94a3b8; font-size: 14px;">${err.message}</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${err.message}' }, '*');
                  setTimeout(() => window.close(), 2000);
                }
              </script>
            </div>
          </body>
        </html>
      `);
    }
  };

  app.get('/auth/callback', handleCallback);
  app.get('/auth/callback/', handleCallback);

  // 4. Exchange code or Refresh token (Direct API)
  app.post('/api/strava/token', async (req: Request, res: Response) => {
    try {
      const { code, refresh_token, client_id, client_secret, grant_type } = req.body;
      const effectiveClientId = client_id || process.env.STRAVA_CLIENT_ID || process.env.CLIENT_ID;
      const effectiveClientSecret =
        client_secret || process.env.STRAVA_CLIENT_SECRET || process.env.CLIENT_SECRET;

      if (!effectiveClientId || !effectiveClientSecret) {
        return res.status(400).json({
          error: 'Missing Strava Client ID or Client Secret.',
          message: 'Server Strava credentials are not configured.',
        });
      }

      const bodyPayload: Record<string, any> = {
        client_id: effectiveClientId,
        client_secret: effectiveClientSecret,
      };

      if (grant_type === 'refresh_token' || refresh_token) {
        bodyPayload.grant_type = 'refresh_token';
        bodyPayload.refresh_token = String(refresh_token)
          .replace(/^Bearer\s+/i, '')
          .replace(/^["']|["']$/g, '')
          .trim();
      } else {
        bodyPayload.grant_type = 'authorization_code';
        bodyPayload.code = String(code).trim();
      }

      const tokenRes = await fetch('https://www.strava.com/api/v3/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return res.status(tokenRes.status).json(tokenData);
      }

      res.json(tokenData);
    } catch (err: any) {
      console.error('Error exchanging Strava token:', err);
      res.status(500).json({ error: err.message || 'Token exchange failed' });
    }
  });

  // 5. Fetch Athlete Activities from Strava with Auto-Refresh
  app.post('/api/strava/activities', async (req: Request, res: Response) => {
    try {
      const {
        access_token,
        refresh_token,
        client_id,
        client_secret,
        page = 1,
        per_page = 100,
        before,
        after,
      } = req.body;

      let cleanAccessToken = String(access_token || '')
        .replace(/^Bearer\s+/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      const cleanRefreshToken = String(refresh_token || '')
        .replace(/^Bearer\s+/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      const effectiveClientId =
        client_id || process.env.STRAVA_CLIENT_ID || process.env.CLIENT_ID;
      const effectiveClientSecret =
        client_secret || process.env.STRAVA_CLIENT_SECRET || process.env.CLIENT_SECRET;

      if (!cleanAccessToken && !cleanRefreshToken) {
        return res.status(401).json({
          error: 'Missing access_token.',
          message: 'Please provide a valid Strava Access Token or reconnect with Strava.',
        });
      }

      const queryParams = new URLSearchParams({
        page: String(page),
        per_page: String(Math.min(Number(per_page) || 100, 200)),
      });

      if (before) queryParams.append('before', String(before));
      if (after) queryParams.append('after', String(after));

      let stravaRes: any = null;
      let activities: any = null;
      let refreshedAuthPayload: any = null;

      // 1. If we have an access token, attempt initial fetch
      if (cleanAccessToken) {
        try {
          stravaRes = await fetch(
            `https://www.strava.com/api/v3/athlete/activities?${queryParams.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${cleanAccessToken}`,
              },
            }
          );
          activities = await stravaRes.json();
        } catch (fetchErr: any) {
          console.warn('Initial Strava activity fetch network error:', fetchErr);
        }
      }

      // 2. If initial fetch was 401 or 403, and we have a refresh token & credentials, attempt auto-refresh
      const isTokenExpiredOrUnauthorized = !stravaRes || stravaRes.status === 401;
      const tokenCandidateForRefresh = cleanRefreshToken || cleanAccessToken;

      if (isTokenExpiredOrUnauthorized && tokenCandidateForRefresh && effectiveClientId && effectiveClientSecret) {
        console.log('Strava token unauthorized (status 401) - attempting automatic token refresh...');
        try {
          const refreshRes = await fetch('https://www.strava.com/api/v3/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: effectiveClientId,
              client_secret: effectiveClientSecret,
              grant_type: 'refresh_token',
              refresh_token: tokenCandidateForRefresh,
            }),
          });

          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.access_token) {
            console.log('Strava token refreshed successfully! Retrying activities fetch...');
            cleanAccessToken = refreshData.access_token;
            refreshedAuthPayload = {
              access_token: refreshData.access_token,
              refresh_token: refreshData.refresh_token || tokenCandidateForRefresh,
              expires_at: refreshData.expires_at,
              athlete: refreshData.athlete,
            };

            // Retry activity fetch with the fresh access token
            stravaRes = await fetch(
              `https://www.strava.com/api/v3/athlete/activities?${queryParams.toString()}`,
              {
                headers: {
                  Authorization: `Bearer ${cleanAccessToken}`,
                },
              }
            );
            activities = await stravaRes.json();
          } else {
            console.warn('Strava refresh token failed:', refreshData);
          }
        } catch (refreshErr) {
          console.warn('Auto-refresh attempt threw error:', refreshErr);
        }
      }

      // 3. Handle 403 Forbidden specifically with detailed diagnostics
      if (stravaRes && stravaRes.status === 403) {
        console.error('Strava API returned 403 Forbidden:', JSON.stringify(activities));
        const rawJsonStr = JSON.stringify(activities || {});
        const isDeveloperAppLimit =
          rawJsonStr.includes('athlete') ||
          rawJsonStr.includes('not authorized') ||
          rawJsonStr.includes('Limit') ||
          rawJsonStr.includes('application');

        const message = isDeveloperAppLimit
          ? 'Strava API Restriction: In developer mode, only the registered developer account can access activities via API. You can import all your runs immediately via the File Upload tab (.csv or .gpx), enter your personal Strava credentials, or load sample runs.'
          : 'Strava activity permission not granted. When authorizing, please ensure the checkbox "View data about your activities" is checked.';

        return res.status(403).json({
          error: 'Strava API Access Forbidden (403)',
          message,
          needsActivityPermission: !isDeveloperAppLimit,
          isDeveloperAppLimit,
          details: activities?.errors || [],
          status: 403,
        });
      }

      // 4. Check other error results
      if (!stravaRes || !stravaRes.ok) {
        const rawMessage = activities?.message || activities?.error;
        let userMessage = 'Failed to fetch activities from Strava.';

        if (rawMessage === 'Authorization Error') {
          userMessage =
            'Strava authorization has expired or is invalid. Please click "Connect with Strava" to renew your session.';
        } else if (rawMessage) {
          userMessage = `Strava API: ${rawMessage}`;
        }

        return res.status(stravaRes ? stravaRes.status : 500).json({
          error: userMessage,
          message: userMessage,
          details: activities?.errors || [],
          status: stravaRes?.status || 500,
        });
      }

      res.json({
        activities: Array.isArray(activities) ? activities : [],
        page: Number(page),
        count: Array.isArray(activities) ? activities.length : 0,
        refreshed_auth: refreshedAuthPayload,
      });
    } catch (err: any) {
      console.error('Error fetching Strava activities:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch activities from Strava', message: err.message });
    }
  });

  // ==========================================
  // Vite Integration (Development & Production)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PeakPulse Korea Full-Stack Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
