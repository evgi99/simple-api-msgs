/**
 * Default JWT secret for development only. Must not be used in production.
 * Production startup validates JWT_SECRET in main.ts.
 */
export const DEFAULT_JWT_SECRET = 'change-me-in-production';

/** Maximum body size for urlencoded form data (bytes or string accepted by express). */
export const URLENCODED_BODY_LIMIT = '1mb';
