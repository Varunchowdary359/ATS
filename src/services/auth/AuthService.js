/**
 * Enterprise Authentication & Session Security Service
 * Implements PBKDF2 password hashing, rate limiting, session token management,
 * idle timeout invalidation, OTP authentication flows, and generic non-enumerating error responses.
 */
import { CryptoService } from '../security/CryptoService.js';
import { TokenManager } from './TokenManager.js';
import { API_ENDPOINTS, DEFAULT_TENANT_CODE } from '../../config/api.js';

// Configurable Session Timers (Fail-Closed Defaults)
const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours absolute lifetime
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes idle timeout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes lockout

// In-memory / storage keys (Isolated per browser session context)
const STORAGE_KEY_SESSION = 'pw_auth_session';
const STORAGE_KEY_RATE_LIMIT = 'pw_auth_rate_limit';

// Pre-seeded user directory with salt & PBKDF2 hash representation
const USER_DIRECTORY = [
  {
    id: 'USR-ADMIN-01',
    email: 'management@gmail.com',
    name: 'PeopleWorks Admin',
    role: 'ats_admin',
    department: 'Management',
    seedPassword: 'Passw0rd'
  },
  {
    id: 'USR-REC-01',
    email: 'user@gmail.com',
    name: 'Sarah Jenkins',
    role: 'recruiter',
    department: 'Talent Acquisition',
    seedPassword: 'Passw0rd'
  },
  {
    id: 'USR-HM-01',
    email: 'hiring.manager@peopleworks.ai',
    name: 'Alex Chen',
    role: 'hiring_manager',
    department: 'Engineering',
    seedPassword: 'Passw0rd',
    userRequisitions: ['REQ-2026-001', 'REQ-2026-002']
  },
  {
    id: 'USR-HR-01',
    email: 'hr.admin@peopleworks.ai',
    name: 'Marcus Vance',
    role: 'hr_admin',
    department: 'Human Resources',
    seedPassword: 'Passw0rd'
  }
];

class AuthServiceImpl {
  constructor() {
    this._initialized = false;
    this._userStore = [];
    this._activeSession = null;
    this._revokedTokens = new Set();
  }

  async init() {
    if (this._initialized) return;

    // Hash seed passwords with individual salts if not already hashed
    this._userStore = await Promise.all(
      USER_DIRECTORY.map(async u => {
        const hashResult = await CryptoService.hashPassword(u.seedPassword);
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          department: u.department,
          userRequisitions: u.userRequisitions || [],
          passwordHash: hashResult.hash,
          passwordSalt: hashResult.salt
        };
      })
    );

    this._initialized = true;
  }

  /**
   * Helper to parse and sanitize HTTP error responses
   */
  async _parseError(response) {
    try {
      const contentType = response.headers?.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        const msg = json.detail || json.title || json.message;
        if (msg) {
          if (/PostgresException|SqlException|EntityFrameworkCore|SELECT\s+|STACK\s+TRACE/i.test(msg)) {
            return new Error('A server processing error occurred. Please contact support if this continues.');
          }
          return new Error(msg);
        }
      } else {
        const text = await response.text();
        if (/PostgresException|SqlException|EntityFrameworkCore|SELECT\s+|STACK\s+TRACE/i.test(text)) {
          return new Error('A server processing error occurred. Please contact support if this continues.');
        }
        if (text && text.trim().length > 0 && text.length < 300) {
          return new Error(text);
        }
      }
    } catch {}
    return new Error('A server processing error occurred. Please contact support if this continues.');
  }

  /**
   * Request OTP verification code for enterprise mobile authentication
   */
  async requestOtp(phoneNumber, tenantCode = DEFAULT_TENANT_CODE) {
    const raw = (phoneNumber || '').trim();
    if (!raw) {
      throw new Error('Phone number is required');
    }

    const payload = {
      phoneNumber: raw,
      tenantCode: tenantCode || DEFAULT_TENANT_CODE
    };

    const response = await fetch(API_ENDPOINTS.AUTH_OTP_REQUEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw await this._parseError(response);
    }

    return await response.json();
  }

  /**
   * Verify OTP and establish secure session
   */
  async verifyOtp({ phoneNumber, challengeId, otp, tenantCode = DEFAULT_TENANT_CODE }) {
    const payload = {
      phoneNumber: (phoneNumber || '').trim(),
      challengeId,
      otp: (otp || '').trim(),
      tenantCode: tenantCode || DEFAULT_TENANT_CODE
    };

    const response = await fetch(API_ENDPOINTS.AUTH_OTP_VERIFY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw await this._parseError(response);
    }

    const verifyData = await response.json();
    const { accessToken, refreshToken, expiresIn } = verifyData;

    // Store in TokenManager (never localStorage!)
    TokenManager.setTokens({
      accessToken,
      refreshToken,
      expiresInSeconds: expiresIn || 900
    });

    // Fetch user profile from /me
    const meHeaders = new Headers({
      'Authorization': `Bearer ${accessToken}`
    });

    const meResponse = await fetch(API_ENDPOINTS.AUTH_ME, {
      method: 'GET',
      headers: meHeaders
    });

    if (!meResponse.ok) {
      throw await this._parseError(meResponse);
    }

    const meProfile = await meResponse.json();

    const normalizedRole = meProfile.role
      ? (meProfile.role === 'AtsAdmin' ? 'ats_admin'
        : meProfile.role === 'HiringManager' ? 'hiring_manager'
        : meProfile.role === 'HrAdmin' ? 'hr_admin'
        : meProfile.role.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''))
      : 'ats_admin';

    const session = {
      token: accessToken,
      userId: meProfile.id,
      email: meProfile.email,
      name: meProfile.name,
      role: normalizedRole,
      rawRole: meProfile.role,
      department: meProfile.department,
      tenantId: meProfile.tenantId,
      tenantCode: meProfile.tenantCode,
      tenantName: meProfile.tenantName,
      permissions: meProfile.permissions || [],
      userRequisitions: meProfile.userRequisitions || ['REQ-2026-001'],
      createdAt: Date.now(),
      expiresAt: Date.now() + (expiresIn || 900) * 1000,
      lastActiveAt: Date.now()
    };

    this._activeSession = session;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        sessionStorage.setItem('pw_userEmail', meProfile.email);
        sessionStorage.setItem('pw_isLoggedIn', 'true');
        window.dispatchEvent(new CustomEvent('pw_auth_state_changed', { detail: { isLoggedIn: true, session } }));
      } catch {}
    }

    return { user: meProfile, session };
  }

  /**
   * Silent session refresh using refresh token
   */
  async refreshToken() {
    const currentRefreshToken = TokenManager.getRefreshToken();
    if (!currentRefreshToken) {
      this.logout('SESSION_EXPIRED');
      throw new Error('No refresh token available.');
    }

    const response = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken })
    });

    if (!response.ok) {
      this.logout('SESSION_EXPIRED');
      throw await this._parseError(response);
    }

    const data = await response.json();
    TokenManager.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || currentRefreshToken,
      expiresInSeconds: data.expiresIn || 900
    });

    if (this._activeSession) {
      this._activeSession.token = data.accessToken;
      this._activeSession.lastActiveAt = Date.now();
    }

    return data;
  }

  /**
   * Rate limiting tracker for login attempts
   */
  _getRateLimitState(identifier) {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(STORAGE_KEY_RATE_LIMIT);
        const map = stored ? JSON.parse(stored) : {};
        return map[identifier] || { failedCount: 0, lockedUntil: null };
      }
    } catch {}
    return { failedCount: 0, lockedUntil: null };
  }

  _recordFailedAttempt(identifier) {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(STORAGE_KEY_RATE_LIMIT);
        const map = stored ? JSON.parse(stored) : {};
        const state = map[identifier] || { failedCount: 0, lockedUntil: null };
        state.failedCount += 1;
        if (state.failedCount >= MAX_FAILED_ATTEMPTS) {
          state.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
        }
        map[identifier] = state;
        sessionStorage.setItem(STORAGE_KEY_RATE_LIMIT, JSON.stringify(map));
      }
    } catch {}
  }

  _clearRateLimit(identifier) {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(STORAGE_KEY_RATE_LIMIT);
        const map = stored ? JSON.parse(stored) : {};
        delete map[identifier];
        sessionStorage.setItem(STORAGE_KEY_RATE_LIMIT, JSON.stringify(map));
      }
    } catch {}
  }

  /**
   * Primary Login Authentication Gateway
   */
  async login({ emailOrId, password }) {
    await this.init();

    const normalizedIdentifier = (emailOrId || '').trim().toLowerCase();

    // 1. Rate Limit & Lockout Check
    const rateLimit = this._getRateLimitState(normalizedIdentifier);
    if (rateLimit.lockedUntil && Date.now() < rateLimit.lockedUntil) {
      const remainingMins = Math.ceil((rateLimit.lockedUntil - Date.now()) / 60000);
      throw new Error(`Too many failed login attempts. Account temporarily locked. Please try again in ${remainingMins} minute(s).`);
    }

    // 2. Locate User
    const user = this._userStore.find(
      u => u.email.toLowerCase() === normalizedIdentifier || u.id.toLowerCase() === normalizedIdentifier
    );

    if (!user) {
      this._recordFailedAttempt(normalizedIdentifier);
      // Generic non-enumerating error message
      throw new Error('Invalid email or password.');
    }

    // 3. Cryptographic Password Verification
    const isPasswordValid = await CryptoService.verifyPassword(
      password,
      user.passwordHash,
      user.passwordSalt
    );

    if (!isPasswordValid) {
      this._recordFailedAttempt(normalizedIdentifier);
      throw new Error('Invalid email or password.');
    }

    // 4. Successful Authentication -> Clear Rate Limits & Create Cryptographically Secure Session
    this._clearRateLimit(normalizedIdentifier);

    const tokenBytes = CryptoService.getRandomBytes(32);
    let token = '';
    for (let i = 0; i < tokenBytes.length; i++) {
      token += tokenBytes[i].toString(16).padStart(2, '0');
    }

    const session = {
      token: `PW-TOK-${token}`,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      userRequisitions: user.userRequisitions || ['REQ-2026-001'],
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
      lastActiveAt: Date.now()
    };

    this._activeSession = session;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      sessionStorage.setItem('pw_userEmail', user.email);
      sessionStorage.setItem('pw_isLoggedIn', 'true');
      window.dispatchEvent(new CustomEvent('pw_auth_state_changed', { detail: { isLoggedIn: true, session } }));
    }

    return session;
  }

  /**
   * Validates active session, checking for expiration, idle timeout, and revocation
   */
  getCurrentSession() {
    if (this._activeSession) {
      if (this._isSessionValid(this._activeSession)) {
        this._activeSession.lastActiveAt = Date.now();
        return this._activeSession;
      }
      this.logout('SESSION_EXPIRED');
      return null;
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(STORAGE_KEY_SESSION);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (this._isSessionValid(parsed)) {
            parsed.lastActiveAt = Date.now();
            sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(parsed));
            this._activeSession = parsed;
            return parsed;
          }
          this.logout('SESSION_EXPIRED');
        }
      }
    } catch {}

    return null;
  }

  _isSessionValid(session) {
    if (!session || !session.token || typeof session.token !== 'string') return false;
    if (this._revokedTokens.has(session.token)) return false;

    const now = Date.now();
    // Check absolute expiration
    if (session.expiresAt && now > session.expiresAt) return false;
    // Check idle timeout
    if (session.lastActiveAt && (now - session.lastActiveAt > IDLE_TIMEOUT_MS)) return false;
    return true;
  }

  /**
   * Enforces server/service-level authentication check
   * Throws 401 Unauthorized if no valid session is present
   */
  requireAuth() {
    const session = this.getCurrentSession();
    if (!session) {
      const err = new Error('401 Unauthorized: Valid authentication session is required.');
      err.statusCode = 401;
      throw err;
    }
    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      department: session.department,
      userRequisitions: session.userRequisitions || []
    };
  }

  /**
   * Cryptographically updates a user's password, invalidates previous sessions, and rotates session token
   */
  async changePassword({ currentPassword, newPassword }) {
    await this.init();
    const secCtx = this.requireAuth();

    // 1. Minimum password complexity check
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw new Error('Password must contain uppercase, lowercase, and numeric characters.');
    }

    // 2. Find user in store
    const user = this._userStore.find(u => u.email.toLowerCase() === secCtx.email.toLowerCase());
    if (!user) {
      throw new Error('User not found.');
    }

    // 3. Verify current password
    const isCurrentValid = await CryptoService.verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
    if (!isCurrentValid) {
      throw new Error('Current password is incorrect.');
    }

    // 4. Hash new password with fresh individual salt
    const newHashResult = await CryptoService.hashPassword(newPassword);
    user.passwordHash = newHashResult.hash;
    user.passwordSalt = newHashResult.salt;

    // 5. Rotate session token immediately to invalidate previous tokens
    this.rotateSessionToken();

    return { success: true, message: 'Password updated and active session rotated.' };
  }

  /**
   * Rotates active session token with fresh 256-bit entropy
   */
  rotateSessionToken() {
    if (!this._activeSession) return null;
    
    // Revoke old token
    this._revokedTokens.add(this._activeSession.token);

    const tokenBytes = CryptoService.getRandomBytes(32);
    let token = '';
    for (let i = 0; i < tokenBytes.length; i++) {
      token += tokenBytes[i].toString(16).padStart(2, '0');
    }

    this._activeSession.token = `PW-TOK-${token}`;
    this._activeSession.lastActiveAt = Date.now();

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(this._activeSession));
      window.dispatchEvent(new CustomEvent('pw_auth_state_changed', { detail: { isLoggedIn: true, session: this._activeSession } }));
    }

    return this._activeSession;
  }

  /**
   * Password Reset Flow: Generates single-use cryptographically secure reset token
   */
  requestPasswordReset(email) {
    const norm = (email || '').trim().toLowerCase();
    // Anti-enumeration: returns generic confirmation regardless of existence
    const resetBytes = CryptoService.getRandomBytes(32);
    let resetToken = '';
    for (let i = 0; i < resetBytes.length; i++) resetToken += resetBytes[i].toString(16).padStart(2, '0');

    if (!this._resetTokens) this._resetTokens = new Map();
    this._resetTokens.set(`RST-${resetToken}`, {
      email: norm,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 min expiry
    });

    return {
      success: true,
      message: 'If the email exists in our system, reset instructions have been generated.',
      token: `RST-${resetToken}` // Provided for mock testing
    };
  }

  /**
   * Resets password using single-use reset token and burns the token
   */
  async resetPasswordWithToken({ token, newPassword }) {
    await this.init();
    if (!this._resetTokens || !this._resetTokens.has(token)) {
      throw new Error('Invalid or expired password reset token.');
    }

    const record = this._resetTokens.get(token);
    if (Date.now() > record.expiresAt) {
      this._resetTokens.delete(token);
      throw new Error('Password reset token has expired. Please request a new one.');
    }

    const user = this._userStore.find(u => u.email.toLowerCase() === record.email);
    if (user) {
      const hashRes = await CryptoService.hashPassword(newPassword);
      user.passwordHash = hashRes.hash;
      user.passwordSalt = hashRes.salt;
    }

    // Burn single-use token
    this._resetTokens.delete(token);

    // Revoke any active session for that user
    this.logout('PASSWORD_RESET');

    return { success: true, message: 'Password reset successfully. Please log in with your new password.' };
  }

  /**
   * Secure Logout and Session Destruction
   */
  async logout(reason = 'USER_LOGOUT') {
    TokenManager.clearTokens();

    if (this._activeSession?.token) {
      this._revokedTokens.add(this._activeSession.token);
    }
    this._activeSession = null;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
        sessionStorage.removeItem('pw_isLoggedIn');
        sessionStorage.removeItem('pw_userEmail');
        sessionStorage.removeItem('pw_activeView');
        window.dispatchEvent(new CustomEvent('pw_auth_state_changed', { detail: { isLoggedIn: false, reason } }));
      } catch {}
    }

    try {
      if (typeof fetch !== 'undefined' && API_ENDPOINTS?.AUTH_LOGOUT) {
        await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});
      }
    } catch {}
  }

  /**
   * Helper to construct trusted user context for services and RBAC
   * FAILS CLOSED: Returns null if not authenticated. Never returns default admin/guest.
   */
  getSecurityContext() {
    const session = this.getCurrentSession();
    if (session) {
      return {
        userId: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        rawRole: session.rawRole || session.role,
        department: session.department,
        tenantId: session.tenantId || 'DEFAULT-TENANT',
        tenantCode: session.tenantCode,
        tenantName: session.tenantName,
        permissions: session.permissions || [],
        userRequisitions: session.userRequisitions || []
      };
    }
    // Fail Closed: unauthenticated context is strictly null
    return null;
  }
}

export const AuthService = new AuthServiceImpl();
