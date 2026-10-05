/**
 * Centralized API & Environment Configuration
 * Connects the React ATS frontend to the ASP.NET Core REST API.
 */

// Fallback to local development API port 5271 if not set in environment
const rawBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:5271/api/v1';

// Ensure no trailing slash
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

// Development default tenant code (TENANT-001)
export const DEFAULT_TENANT_CODE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEV_TENANT_CODE)
  ? import.meta.env.VITE_DEV_TENANT_CODE
  : 'TENANT-001';

export const API_ENDPOINTS = {
  // Authentication & Session Endpoints
  AUTH_OTP_REQUEST: `${API_BASE_URL}/auth/otp/request`,
  AUTH_OTP_VERIFY: `${API_BASE_URL}/auth/otp/verify`,
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  AUTH_REFRESH: `${API_BASE_URL}/auth/refresh`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  AUTH_LOGOUT_ALL: `${API_BASE_URL}/auth/logout-all`,
  AUTH_DEV_LAST_OTP: `${API_BASE_URL}/auth/dev/last-otp`
};
