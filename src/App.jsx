import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Home from './components/Home';
import PublicJobPosting from './components/PublicJobPosting';
import HtmlShowcase from './components/HtmlShowcase';
import { AppContext } from './AppContext';
import { ToastProvider, useToast } from './components/shared/ToastContext';
import { AuthService } from './services/auth/AuthService';
import GlobalTextToSpeech from './components/shared/GlobalTextToSpeech';

function AppContent() {
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      const session = AuthService.getCurrentSession();
      return !!session;
    }
    return false;
  });

  const [publicJd, setPublicJd] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pw_publicJd');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  const [showHtmlShowcase, setShowHtmlShowcase] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pw_showHtmlShowcase');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Verify active session on mount, window focus, and interval (Heartbeat)
  const verifySession = useCallback(() => {
    if (typeof window === 'undefined') return;
    const session = AuthService.getCurrentSession();
    if (!session && isLoggedIn) {
      setIsLoggedIn(false);
      showToast('Your session has expired. Please sign in again.', 'warning');
    }
  }, [isLoggedIn, showToast]);

  useEffect(() => {
    const handleAuthStateChange = (e) => {
      const { isLoggedIn: loggedInStatus, reason } = e.detail || {};
      setIsLoggedIn(!!loggedInStatus);
      if (!loggedInStatus && reason === 'SESSION_EXPIRED') {
        showToast('Your session has expired. Please sign in again.', 'warning');
      }
    };

    const handleFocus = () => {
      verifySession();
    };

    window.addEventListener('pw_auth_state_changed', handleAuthStateChange);
    window.addEventListener('focus', handleFocus);

    // 30-second session heartbeat to enforce idle timeout and absolute expiration
    const interval = setInterval(verifySession, 30000);

    return () => {
      window.removeEventListener('pw_auth_state_changed', handleAuthStateChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [verifySession, showToast]);

  useEffect(() => {
    sessionStorage.setItem('pw_isLoggedIn', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    sessionStorage.setItem('pw_publicJd', JSON.stringify(publicJd));
  }, [publicJd]);

  useEffect(() => {
    sessionStorage.setItem('pw_showHtmlShowcase', JSON.stringify(showHtmlShowcase));
  }, [showHtmlShowcase]);

  return (
    <AppContext.Provider value={{ setPublicJd, showHtmlShowcase, setShowHtmlShowcase }}>
      {showHtmlShowcase ? (
        <HtmlShowcase onBack={() => setShowHtmlShowcase(false)} />
      ) : publicJd ? (
        <PublicJobPosting jd={publicJd} onBack={() => setPublicJd(null)} />
      ) : isLoggedIn ? (
        <Home onLogout={() => {
          AuthService.logout('USER_LOGOUT');
          setIsLoggedIn(false);
        }} />
      ) : (
        <Login onLogin={() => setIsLoggedIn(true)} />
      )}
      {/* Universal Enterprise Text-to-Speech Engine */}
      <GlobalTextToSpeech />
    </AppContext.Provider>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
