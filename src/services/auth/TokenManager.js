/**
 * Centralized Token Manager
 *
 * Security Architecture:
 * - Access tokens are held exclusively in-memory (closure scope).
 * - Refresh tokens are managed through this centralized abstraction.
 * - STRICT RULE: Access tokens and refresh tokens are NEVER stored in localStorage.
 * - Refresh tokens are stored in sessionStorage exclusively to withstand page refreshes
 *   during enterprise workflows, with fail-safe in-memory caching.
 * - Designed to seamlessly transition to HttpOnly secure cookies without UI modifications.
 */

const STORAGE_KEY_REFRESH = 'pw_auth_rt_session';

class TokenManagerImpl {
  constructor() {
    this._accessToken = null;
    this._tokenExpiry = null;
    this._refreshToken = null;
  }

  /**
   * Stores freshly issued tokens in memory and session scope.
   */
  setTokens({ accessToken, refreshToken, expiresInSeconds }) {
    this._accessToken = accessToken || null;
    this._refreshToken = refreshToken || null;

    if (expiresInSeconds && typeof expiresInSeconds === 'number') {
      this._tokenExpiry = Date.now() + expiresInSeconds * 1000;
    } else {
      // Default 15 minutes if not specified
      this._tokenExpiry = Date.now() + 15 * 60 * 1000;
    }

    if (typeof window !== 'undefined' && refreshToken) {
      try {
        sessionStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);
      } catch {
        // Fallback to memory only if sessionStorage is restricted
      }
    }
  }

  /**
   * Retrieves the current in-memory access token.
   */
  getAccessToken() {
    return this._accessToken;
  }

  /**
   * Checks if the access token exists and is not expired (with 30s buffer).
   */
  isAccessTokenValid() {
    if (!this._accessToken || !this._tokenExpiry) return false;
    return Date.now() < this._tokenExpiry - 30 * 1000;
  }

  /**
   * Retrieves the refresh token from memory or active session storage.
   */
  getRefreshToken() {
    if (this._refreshToken) return this._refreshToken;

    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY_REFRESH);
        if (stored) {
          this._refreshToken = stored;
          return stored;
        }
      } catch {}
    }

    return null;
  }

  /**
   * Updates only the access token (e.g. after silent refresh).
   */
  setAccessToken(accessToken, expiresInSeconds = 900) {
    this._accessToken = accessToken;
    this._tokenExpiry = Date.now() + (expiresInSeconds || 900) * 1000;
  }

  /**
   * Clears all in-memory tokens and session storage.
   */
  clearTokens() {
    this._accessToken = null;
    this._tokenExpiry = null;
    this._refreshToken = null;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY_REFRESH);
      } catch {}
    }
  }
}

export const TokenManager = new TokenManagerImpl();
