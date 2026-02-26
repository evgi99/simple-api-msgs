/**
 * Default JWT secret for development only. Must not be used in production.
 * Production startup validates JWT_SECRET in main.ts.
 */
export const DEFAULT_JWT_SECRET = 'change-me-in-production';

/** Access token lifetime. Short-lived for API authorization. */
export const ACCESS_TOKEN_EXPIRY = '15m';

/** Refresh token lifetime. Used to obtain new access tokens. */
export const REFRESH_TOKEN_EXPIRY = '7d';

/** Maximum body size for urlencoded form data (bytes or string accepted by express). */
export const URLENCODED_BODY_LIMIT = '1mb';
