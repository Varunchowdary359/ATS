/**
 * Centralized Authenticated API Client
 * Automatically attaches Authorization headers and handles response normalization.
 */

import { TokenManager } from '../auth/TokenManager.js';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.js';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * Normalizes backend error responses into safe, user-friendly error messages.
 * Never leaks server stack traces, SQL errors, or JWT internals.
 */
export function normalizeApiError(errorData, fallbackMessage = 'An unexpected error occurred. Please try again.') {
  if (!errorData) return fallbackMessage;

  if (typeof errorData === 'string') {
    // Sanitize any accidental HTML/stack trace leaks
    if (errorData.includes('Exception') || errorData.includes('at ') || errorData.includes('SELECT ')) {
      return 'A server processing error occurred. Please contact support if this continues.';
    }
    return errorData;
  }

  // ASP.NET Core ProblemDetails (RFC 7807)
  if (errorData.detail && typeof errorData.detail === 'string') {
    return errorData.detail;
  }

  if (errorData.title && typeof errorData.title === 'string' && errorData.title !== 'Bad Request' && errorData.title !== 'Unauthorized') {
    return errorData.title;
  }

  if (errorData.message && typeof errorData.message === 'string') {
    return errorData.message;
  }

  // Validation errors map
  if (errorData.errors && typeof errorData.errors === 'object') {
    const firstKey = Object.keys(errorData.errors)[0];
    if (firstKey && Array.isArray(errorData.errors[firstKey]) && errorData.errors[firstKey].length > 0) {
      return errorData.errors[firstKey][0];
    }
  }

  return fallbackMessage;
}

/**
 * Universal fetch wrapper for all ATS API communications.
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach in-memory Access Token if available and not explicitly bypassed
  const accessToken = TokenManager.getAccessToken();
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    let response = await fetch(url, fetchOptions);

    // If 401 Unauthorized occurs on an authenticated endpoint, attempt automatic silent refresh
    const isAuthEndpoint = url.includes('/auth/otp/') || url.includes('/auth/refresh') || url.includes('/auth/logout');
    
    if (response.status === 401 && !isAuthEndpoint && !options._isRetry) {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            const refreshResponse = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              TokenManager.setTokens({
                accessToken: refreshData.accessToken,
                refreshToken: refreshData.refreshToken,
                expiresInSeconds: refreshData.expiresInSeconds || 900
              });
              isRefreshing = false;
              onRefreshed(refreshData.accessToken);
            } else {
              isRefreshing = false;
              TokenManager.clearTokens();
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('pw_auth_state_changed', { detail: { isLoggedIn: false, reason: 'SESSION_EXPIRED' } }));
              }
              const errData = await refreshResponse.json().catch(() => ({}));
              const message = normalizeApiError(errData, 'Session has expired. Please log in again.');
              const error = new Error(message);
              error.status = 401;
              throw error;
            }
          } catch (refreshErr) {
            isRefreshing = false;
            TokenManager.clearTokens();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('pw_auth_state_changed', { detail: { isLoggedIn: false, reason: 'SESSION_EXPIRED' } }));
            }
            throw refreshErr;
          }
        }

        // Wait for active refresh to complete
        const newAccessToken = await new Promise(resolve => {
          subscribeTokenRefresh(token => resolve(token));
        });

        // Retry original request with fresh access token
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient(endpoint, {
          ...options,
          headers,
          _isRetry: true
        });
      }
    }

    // Parse Response
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const responseData = isJson ? await response.json().catch(() => null) : await response.text();

    if (!response.ok) {
      const errorMsg = normalizeApiError(responseData, `Request failed with status ${response.status}`);
      const apiError = new Error(errorMsg);
      apiError.status = response.status;
      apiError.data = responseData;
      throw apiError;
    }

    return responseData;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to the PeopleWorks ATS server. Please verify the backend service is running.');
      networkError.status = 0;
      throw networkError;
    }
    throw error;
  }
}
