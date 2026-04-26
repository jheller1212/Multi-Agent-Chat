import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { WorkshopPublicInfo } from './components/Auth';
import { StorageNotice } from './components/StorageNotice';

const Auth = lazy(() => import('./components/Auth').then(m => ({ default: m.Auth })));
const ResearchInterface = lazy(() => import('./components/ResearchInterface').then(m => ({ default: m.ResearchInterface })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfUse = lazy(() => import('./components/TermsOfUse').then(m => ({ default: m.TermsOfUse })));
import { clearVault, loadVault, loadVaultFromServer, syncVaultToServer, saveVault } from './lib/apiKeyVault';
import type { ProviderVault } from './lib/apiKeyVault';

export interface WorkshopData {
  name: string;
  welcome: string;
  provider: string;
  apiKey: string;
  scenario: { botAPrompt: string; botBPrompt: string; sharedPrompt: string; stopKeywords: string; botMode: 'symmetric' | 'asymmetric' } | null;
  config: Record<string, unknown> | null;
}

// Parse URL parameters once on module load so they survive re-renders.
function parseUrlParams() {
  const p = new URLSearchParams(window.location.search);
  const sessionId = p.get('session_id') ?? undefined;
  const conditionLabel = p.get('condition') ?? undefined;
  const workshop = p.get('workshop') ?? undefined;
  let sharedConfig: Record<string, unknown> | undefined;
  const cfg = p.get('cfg');
  if (cfg) {
    try { sharedConfig = JSON.parse(atob(cfg)); } catch { /* invalid — ignore */ }
  }
  return { sessionId, conditionLabel, sharedConfig, workshop };
}

const URL_PARAMS = parseUrlParams();

type View = 'landing' | 'auth' | 'app' | 'privacy' | 'terms';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('landing');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [workshopData, setWorkshopData] = useState<WorkshopData | null>(null);
  const [workshopPublicInfo, setWorkshopPublicInfo] = useState<WorkshopPublicInfo | null>(null);
  const [workshopInactive, setWorkshopInactive] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('ai2ai_theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ai2ai_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Load encrypted API keys from server, or migrate existing localStorage keys
  const restoreVault = async () => {
    try {
      const serverKeys = await loadVaultFromServer();
      const hasServerKeys = Object.values(serverKeys).some(k => k.length > 0);
      if (!hasServerKeys) {
        const localKeys = loadVault();
        const hasLocalKeys = Object.values(localKeys).some(k => k.length > 0);
        if (hasLocalKeys) {
          await syncVaultToServer(localKeys);
        }
      }
    } catch { /* non-blocking */ }
  };

  // Fetch workshop config and inject API key into vault
  const loadWorkshop = async () => {
    if (!URL_PARAMS.workshop) return;
    try {
      const { data, error } = await supabase.functions.invoke('workshop-config', {
        body: { action: 'get', code: URL_PARAMS.workshop },
      });
      if (error || !data || data.error) return;

      setWorkshopData(data as WorkshopData);

      // Inject the workshop API key into the user's vault
      if (data.apiKey && data.provider) {
        const vault = loadVault();
        const provider = data.provider as keyof ProviderVault;
        if (provider in vault) {
          saveVault({ ...vault, [provider]: data.apiKey });
        }
      }
    } catch { /* non-blocking */ }
  };

  // Fetch public workshop info (no auth needed) for the sign-up banner
  const loadWorkshopPublicInfo = async () => {
    if (!URL_PARAMS.workshop) return;
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workshop-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-public', code: URL_PARAMS.workshop }),
      });
      const data = await resp.json();
      if (resp.ok && data.inactive) {
        setWorkshopInactive(data.name || 'This workshop');
      } else if (resp.ok && data.name) {
        setWorkshopPublicInfo({ name: data.name, welcome: data.welcome || '' });
      }
    } catch { /* non-blocking */ }
  };

  // Fire-and-forget: track that a user signed up via a workshop link
  const trackWorkshopSignup = async (accessToken: string) => {
    if (!URL_PARAMS.workshop) return;
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workshop-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action: 'track-signup', code: URL_PARAMS.workshop }),
      });
    } catch { /* non-blocking */ }
  };

  useEffect(() => {
    // Fetch public workshop info immediately (before auth)
    loadWorkshopPublicInfo().catch(() => {});
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setView('app');
        restoreVault().catch(() => {});
        loadWorkshop().catch(() => {});
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        restoreVault().catch(() => {});
        loadWorkshop().catch(() => {});
        // Only track signup on actual sign-in, not token refresh
        if (event === 'SIGNED_IN') {
          trackWorkshopSignup(session.access_token).catch(() => {});
        }
      }
      if (!session) setView('landing');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Idle timeout: sign out and clear vault after 30 minutes of inactivity.
  useEffect(() => {
    if (!session) return;

    const IDLE_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(handleSignOut, IDLE_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [session]);

  const handleSignOut = async () => {
    try {
      const raw = localStorage.getItem('ai2ai_settings');
      if (raw) {
        const s = JSON.parse(raw);
        localStorage.setItem('ai2ai_settings', JSON.stringify({ ...s, apiKey1: '', apiKey2: '' }));
      }
    } catch { /* ignore */ }
    clearVault();
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const storageNotice = <StorageNotice onPrivacyClick={() => setView('privacy')} />;

  const suspenseFallback = (
    <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Workshop link: show inactive message or skip to auth
  if (view === 'landing' && URL_PARAMS.workshop && !session) {
    if (workshopInactive) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏸</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{workshopInactive}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This workshop session has ended or is currently inactive. Please contact the workshop organizer for access or an updated link.
            </p>
            <button
              onClick={() => { window.location.href = window.location.origin; }}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-sky-500 rounded-lg hover:from-orange-400 hover:to-sky-400 transition-all"
            >
              Go to AI2AI Chat
            </button>
          </div>
        </div>
      );
    }
    return <Suspense fallback={suspenseFallback}>{storageNotice}<Auth onAuthSuccess={() => setView('app')} initialIsSignUp={authMode === 'signup'} workshopInfo={workshopPublicInfo} /></Suspense>;
  }

  if (view === 'auth') {
    return <Suspense fallback={suspenseFallback}>{storageNotice}<Auth onAuthSuccess={() => setView('app')} initialIsSignUp={authMode === 'signup'} workshopInfo={workshopPublicInfo} /></Suspense>;
  }

  if (view === 'app' && session) {
    return (
      <Suspense fallback={suspenseFallback}>
        {storageNotice}
        <ResearchInterface
          onSignOut={handleSignOut}
          onBack={() => setView('landing')}
          user={session.user}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(v => !v)}
          sessionId={URL_PARAMS.sessionId}
          conditionLabel={URL_PARAMS.conditionLabel}
          sharedConfig={URL_PARAMS.sharedConfig}
          workshopData={workshopData}
        />
      </Suspense>
    );
  }

  if (view === 'privacy') {
    return <Suspense fallback={suspenseFallback}>{storageNotice}<PrivacyPolicy onBack={() => setView('landing')} /></Suspense>;
  }

  if (view === 'terms') {
    return <Suspense fallback={suspenseFallback}>{storageNotice}<TermsOfUse onBack={() => setView('landing')} /></Suspense>;
  }

  const goToSignIn = () => { setAuthMode('signin'); setView(session ? 'app' : 'auth'); };
  const goToSignUp = () => { setAuthMode('signup'); setView(session ? 'app' : 'auth'); };

  return (
    <Suspense fallback={suspenseFallback}>
      {storageNotice}
      <LandingPage
        onAuthClick={goToSignIn}
        onSignUpClick={goToSignUp}
        isAuthenticated={!!session}
        onPrivacyClick={() => setView('privacy')}
        onTermsClick={() => setView('terms')}
      />
    </Suspense>
  );
}

export default App;
