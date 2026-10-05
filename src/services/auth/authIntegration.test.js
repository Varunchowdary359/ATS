import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './AuthService.js';
import { TokenManager } from './TokenManager.js';
import { API_BASE_URL, API_ENDPOINTS, DEFAULT_TENANT_CODE } from '../../config/api.js';

describe('Phase 2A — PeopleWorks ATS Frontend Authentication & Session Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    TokenManager.clearTokens();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
      window.localStorage.clear();
    }
  });

  describe('1. Phone Validation & Normalization', () => {
    it('should require a non-empty phone number', async () => {
      await expect(AuthService.requestOtp('')).rejects.toThrow('Phone number is required');
      await expect(AuthService.requestOtp('   ')).rejects.toThrow('Phone number is required');
    });

    it('should format payload with default tenant when not specified', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          challengeId: 'mock-chal-123',
          message: 'OTP sent',
          expiresInSeconds: 300,
          devOtp: '654321'
        })
      });

      const res = await AuthService.requestOtp('+91 7793988059');
      expect(res.challengeId).toBe('mock-chal-123');
      expect(fetchSpy).toHaveBeenCalledWith(
        API_ENDPOINTS.AUTH_OTP_REQUEST,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            phoneNumber: '+91 7793988059',
            tenantCode: DEFAULT_TENANT_CODE
          })
        })
      );
    });
  });

  describe('2. OTP Request Flow (Success, Failure, Resend)', () => {
    it('should handle successful OTP request and return challenge details', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          challengeId: 'chal-abc-001',
          message: 'If the phone number is registered, an OTP verification code has been sent.',
          expiresInSeconds: 300,
          devOtp: '998877'
        })
      });

      const res = await AuthService.requestOtp('+91 7793988059', 'TENANT-001');
      expect(res.challengeId).toBe('chal-abc-001');
      expect(res.expiresInSeconds).toBe(300);
      expect(res.devOtp).toBe('998877');
    });

    it('should handle OTP request failure (e.g. 400 Bad Request)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          title: 'Invalid Phone Number',
          detail: 'Phone number format is invalid.'
        })
      });

      await expect(AuthService.requestOtp('invalid-phone')).rejects.toThrow('Phone number format is invalid.');
    });

    it('should handle rate limiting on OTP request (429 Too Many Requests)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          title: 'Too Many Requests',
          detail: 'Too many OTP requests. Please wait 60 seconds before requesting again.'
        })
      });

      await expect(AuthService.requestOtp('+91 7793988059')).rejects.toThrow(/Too many OTP requests/);
    });
  });

  describe('3. OTP Verification & Session Establishment', () => {
    it('should verify valid OTP, store tokens, load /me, and return authenticated user', async () => {
      // 1. Verify OTP response
      const verifyResponse = {
        accessToken: 'mock-access-token-jwt-999',
        refreshToken: 'mock-refresh-token-opaque-888',
        tokenType: 'Bearer',
        expiresIn: 900
      };

      // 2. /me profile response
      const meProfile = {
        id: 'usr-dev-001',
        userCode: 'USR-DEV-01',
        email: 'sujith@peopleworks.local',
        name: 'Sujith Palanisamy',
        role: 'AtsAdmin',
        department: 'Engineering',
        tenantId: '11111111-1111-1111-1111-111111111111',
        tenantCode: 'TENANT-001',
        tenantName: 'PeopleWorks Enterprise',
        permissions: ['requisitions.view', 'candidates.view']
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => verifyResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => meProfile
        });

      const result = await AuthService.verifyOtp({
        phoneNumber: '+91 7793988059',
        challengeId: 'chal-abc-001',
        otp: '667078',
        tenantCode: 'TENANT-001'
      });

      expect(result.user.email).toBe('sujith@peopleworks.local');
      expect(result.user.name).toBe('Sujith Palanisamy');

      // Tokens must be in TokenManager
      expect(TokenManager.getAccessToken()).toBe('mock-access-token-jwt-999');
      expect(TokenManager.getRefreshToken()).toBe('mock-refresh-token-opaque-888');

      // Check security context mapping
      const secCtx = AuthService.getSecurityContext();
      expect(secCtx).not.toBeNull();
      expect(secCtx.role).toBe('ats_admin');
      expect(secCtx.rawRole).toBe('AtsAdmin');
      expect(secCtx.email).toBe('sujith@peopleworks.local');

      // Second call was /me with Authorization header
      expect(fetchSpy).toHaveBeenLastCalledWith(
        API_ENDPOINTS.AUTH_ME,
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers)
        })
      );
    });

    it('should reject invalid OTP with 400 Bad Request message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          title: 'Verification Failed',
          detail: 'Invalid OTP. 4 attempts remaining.'
        })
      });

      await expect(AuthService.verifyOtp({
        phoneNumber: '+91 7793988059',
        challengeId: 'chal-abc-001',
        otp: '000000'
      })).rejects.toThrow('Invalid OTP. 4 attempts remaining.');
    });

    it('should reject expired OTP or already used OTP', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          title: 'Verification Failed',
          detail: 'This OTP has already been used.'
        })
      });

      await expect(AuthService.verifyOtp({
        phoneNumber: '+91 7793988059',
        challengeId: 'chal-abc-001',
        otp: '667078'
      })).rejects.toThrow('This OTP has already been used.');
    });
  });

  describe('4. Token Security & Storage Constraints', () => {
    it('MUST NOT write access tokens or refresh tokens to localStorage', () => {
      TokenManager.setTokens({
        accessToken: 'secret-access-token',
        refreshToken: 'secret-refresh-token',
        expiresInSeconds: 900
      });

      expect(localStorage.getItem('pw_access_token')).toBeNull();
      expect(localStorage.getItem('pw_refresh_token')).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();

      // Tokens accessible through TokenManager
      expect(TokenManager.getAccessToken()).toBe('secret-access-token');
      expect(TokenManager.getRefreshToken()).toBe('secret-refresh-token');
    });

    it('clears all tokens and session state on logout', async () => {
      TokenManager.setTokens({
        accessToken: 'access-to-clear',
        refreshToken: 'refresh-to-clear',
        expiresInSeconds: 900
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Logged out successfully.' })
      });

      await AuthService.logout('USER_LOGOUT');

      expect(TokenManager.getAccessToken()).toBeNull();
      expect(TokenManager.getRefreshToken()).toBeNull();
      expect(AuthService.getCurrentSession()).toBeNull();
      expect(AuthService.getSecurityContext()).toBeNull();
    });
  });

  describe('5. Silent Session Refresh on Expiry', () => {
    it('successfully refreshes token with POST /api/v1/auth/refresh', async () => {
      TokenManager.setTokens({
        accessToken: 'old-access-token',
        refreshToken: 'valid-refresh-token',
        expiresInSeconds: 900
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          accessToken: 'new-fresh-access-token',
          refreshToken: 'new-fresh-refresh-token',
          expiresIn: 900
        })
      });

      const refreshRes = await AuthService.refreshToken();
      expect(refreshRes.accessToken).toBe('new-fresh-access-token');
      expect(TokenManager.getAccessToken()).toBe('new-fresh-access-token');
      expect(TokenManager.getRefreshToken()).toBe('new-fresh-refresh-token');
    });

    it('fails closed and clears session if refresh token is rejected', async () => {
      TokenManager.setTokens({
        accessToken: 'expired-access-token',
        refreshToken: 'revoked-refresh-token',
        expiresInSeconds: 900
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          title: 'Unauthorized',
          detail: 'Refresh token is invalid or expired.'
        })
      });

      await expect(AuthService.refreshToken()).rejects.toThrow();
      expect(TokenManager.getAccessToken()).toBeNull();
      expect(AuthService.getCurrentSession()).toBeNull();
    });
  });

  describe('6. Error Sanitization & Security Boundary', () => {
    it('should never expose stack traces or raw SQL in error messages', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Npgsql.PostgresException: 23505: SELECT * FROM Users ... Exception at Microsoft.EntityFrameworkCore'
      });

      await expect(AuthService.requestOtp('+91 7793988059')).rejects.toThrow('A server processing error occurred. Please contact support if this continues.');
    });
  });
});
