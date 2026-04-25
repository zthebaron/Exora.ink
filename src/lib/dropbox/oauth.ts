/**
 * Dropbox OAuth 2.0 helpers — one-time flow that produces a long-lived
 * refresh token. The refresh token never expires (unless revoked) and the
 * SDK uses it to mint short-lived access tokens automatically before each
 * API call.
 *
 * Flow:
 *   1. Build authorize URL with token_access_type=offline (this is what
 *      makes Dropbox return a refresh token).
 *   2. Operator visits the URL, approves the app.
 *   3. Dropbox redirects back to /admin/dropbox-auth?code=ABC123.
 *   4. UI POSTs the code to /api/dropbox/auth/exchange.
 *   5. Server exchanges code+app_key+app_secret for { access_token, refresh_token }.
 *   6. Operator pastes the refresh_token into .env.local + Vercel env vars.
 */

import { DropboxAuth } from "dropbox";

export const DROPBOX_AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";

export interface DropboxTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  uid?: string;
  accountId?: string;
}

/**
 * Build the URL we redirect the user to for consent.
 *
 * @param appKey      Dropbox App key (public)
 * @param redirectUri Must EXACTLY match a Redirect URI registered on the app
 */
export function buildAuthorizeUrl(appKey: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: appKey,
    token_access_type: "offline", // <- this is the magic flag for refresh tokens
    redirect_uri: redirectUri,
  });
  return `${DROPBOX_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for { accessToken, refreshToken }.
 */
export async function exchangeCodeForTokens(
  code: string,
  appKey: string,
  appSecret: string,
  redirectUri: string
): Promise<DropboxTokens> {
  const auth = new DropboxAuth({ clientId: appKey, clientSecret: appSecret });
  // The SDK has getAccessTokenFromCode which handles the token endpoint call.
  const result = (await auth.getAccessTokenFromCode(redirectUri, code)) as {
    result?: {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      uid?: string;
      account_id?: string;
    };
  };

  const r = result.result ?? {};
  if (!r.access_token || !r.refresh_token) {
    throw new Error(
      "Dropbox did not return a refresh token. Make sure the authorize URL used token_access_type=offline."
    );
  }
  return {
    accessToken: r.access_token,
    refreshToken: r.refresh_token,
    expiresIn: r.expires_in ?? 0,
    scope: r.scope ?? "",
    uid: r.uid,
    accountId: r.account_id,
  };
}
