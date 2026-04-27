import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Icon } from './research/Icon';
import { Logo } from './Logo';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export interface WorkshopPublicInfo {
  name: string;
  welcome: string;
}

interface AuthProps {
  onAuthSuccess: () => void;
  initialIsSignUp?: boolean;
  workshopInfo?: WorkshopPublicInfo | null;
}

const TERMS_TEXT = `TERMS OF USE & USER AGREEMENT
Last updated: March 2026

By creating an account and using AI2AI Chat ("the Service"), you agree to the following terms. If you do not agree, do not use the Service.

1. ACCEPTANCE OF TERMS
By registering, you confirm that you are at least 16 years of age and legally capable of entering into this agreement. If you are accessing the Service on behalf of an organisation, you represent that you have authority to bind that organisation to these terms.

2. SERVICE PROVIDED "AS IS"
The Service is provided on an "as is" and "as available" basis without warranties of any kind, express or implied. The operator makes no representations regarding the accuracy, reliability, completeness, or fitness for a particular purpose of any content generated through the Service. Use of the Service is entirely at your own risk.

3. LIMITATION OF LIABILITY
To the fullest extent permitted by applicable law, the operator shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Service — including but not limited to damages resulting from AI-generated content, data loss, or reliance on information obtained through the Service.

4. THIRD-PARTY AI SERVICES & API KEYS
You are solely responsible for obtaining and managing your own API keys from third-party AI providers (including but not limited to OpenAI, Anthropic, Google, and Mistral). You agree to comply with the terms of service of any third-party AI provider whose services you access through this platform. The operator assumes no responsibility for charges, restrictions, or actions taken by third-party providers in relation to your API usage.

5. ACCEPTABLE USE
You agree not to use the Service to:
- Generate, distribute, or facilitate illegal, abusive, defamatory, or harmful content
- Produce, promote, or distribute child sexual abuse material (CSAM) or content exploiting minors
- Harass, threaten, or impersonate any individual or organisation
- Circumvent the safety systems, rate limits, or terms of service of any AI provider
- Conduct automated bulk usage that violates provider policies
- Engage in activities regulated by export control laws (ITAR/EAR) without authorisation
- Violate any applicable local, national, or international law

6. ACCOUNT SUSPENSION & TERMINATION
The operator may suspend or terminate your access at any time for any reason, including breach of these Terms, without liability. You may delete your account at any time from Settings. All associated data is permanently removed within 30 days of deletion.

7. EMAIL COMMUNICATIONS
By creating an account, you agree to receive service-related emails including account confirmations, important notices, and occasional product updates. You may opt out of non-essential communications at any time.

8. DATA & PRIVACY
Conversation data you choose to save may be stored to provide the Service. You retain ownership of your content. The operator will not sell your personal data to third parties. Data is stored via Supabase (US servers). For full details, see the Privacy Policy at ai2aichat.com. Data retention: account data is kept until you delete your account, after which it is removed within 30 days.

9. GOVERNING LAW
These Terms are governed by the laws of the European Union and, where applicable, the laws of the country in which the operator is established. Disputes shall be subject to the exclusive jurisdiction of the competent courts of that jurisdiction. EU consumers retain the benefit of mandatory consumer protection laws in their country of residence.

10. CHANGES TO TERMS
These Terms may be updated from time to time. We will notify you by email or in-app notice for material changes. Continued use of the Service after the effective date constitutes acceptance of the revised terms.`;

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', borderRadius: 6,
  border: '1px solid var(--line-2)',
  background: 'var(--surface-panel)',
  color: 'var(--text-1)',
  fontFamily: 'var(--font-app)', fontSize: 14,
  outline: 'none',
};

const inputWithIconStyle: React.CSSProperties = {
  ...inputStyle,
  paddingLeft: 36,
};

const inputWithIconRightStyle: React.CSSProperties = {
  ...inputStyle,
  paddingLeft: 36,
  paddingRight: 36,
};

export function Auth({ onAuthSuccess, initialIsSignUp = false, workshopInfo }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const switchMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setError(null);
    setConfirmPassword('');
    setAgreedToTerms(false);
    setShowTerms(false);
    setForgotSent(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      // Page redirects to provider — loading state intentionally left active
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email address above, then click Forgot password.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreedToTerms) {
        setError('You must agree to the Terms of Use to create an account.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        if (data.session) {
          onAuthSuccess();
        } else {
          setAwaitingConfirmation(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        setError('Unable to reach the authentication server. Please check your internet connection and try again.');
      } else if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('Invalid login credentials')) {
          setError('Incorrect email or password.');
        } else if (msg.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in.');
        } else if (msg.includes('User already registered')) {
          setError('An account with this email already exists. Try signing in instead.');
        } else if (msg.includes('Password should be')) {
          setError('Password must be at least 6 characters.');
        } else {
          setError(msg);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (awaitingConfirmation) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div
          style={{
            maxWidth: 420, width: '100%', background: 'var(--surface-panel)',
            border: '1px solid var(--line-1)', borderRadius: 10,
            boxShadow: 'var(--shadow-3)', padding: 36, textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(46,163,107,0.12)', color: 'var(--success)',
              display: 'grid', placeItems: 'center', margin: '0 auto 20px',
            }}
          >
            <Icon name="check" size={22} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 20, color: 'var(--text-1)', margin: '0 0 10px' }}>
            Check your email
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 24px' }}>
            We sent a confirmation link to <strong>{email}</strong>.
            Click the link to activate your account, then come back and sign in.
          </p>
          <button
            onClick={() => { setAwaitingConfirmation(false); switchMode(false); }}
            className="r-btn r-btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        style={{
          maxWidth: 420, width: '100%',
          background: 'var(--surface-panel)',
          border: '1px solid var(--line-1)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-3)',
          padding: 32,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* Logo + heading */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Logo />
          <h2 style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 20, color: 'var(--text-1)', margin: 0 }}>
            {isSignUp ? 'Create your account' : 'Sign in'}
          </h2>
        </div>

        {/* Workshop banner */}
        {workshopInfo && (
          <div
            style={{
              background: 'var(--accent-2-soft)', border: '1px solid var(--accent-2)',
              borderRadius: 6, padding: '12px 14px', textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14, color: 'var(--accent-2)', marginBottom: 4 }}>
              {workshopInfo.name}
            </div>
            {workshopInfo.welcome && (
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>{workshopInfo.welcome}</p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'var(--accent-1-soft)', border: '1px solid var(--accent-1)',
              borderRadius: 6, padding: '10px 12px',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}
          >
            <Icon name="x" size={14} style={{ color: 'var(--accent-1)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--accent-1)', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* OAuth buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
            className="r-btn r-btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
            className="r-btn r-btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <GitHubIcon />
            Continue with GitHub
          </button>
          {isSignUp && (
            <p style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', margin: 0 }}>
              By continuing with Google or GitHub, you agree to our Terms of Use and Privacy Policy.
            </p>
          )}
        </div>

        {/* Divider */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line-1)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }}>
            or continue with email
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--line-1)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Email */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }}>
              <Icon name="user" size={15} />
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputWithIconStyle}
              placeholder="Email address"
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }}>
              <Icon name="eye" size={15} />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputWithIconRightStyle}
              placeholder="Password (min 6 characters)"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 0 }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Confirm password — sign-up only */}
          {isSignUp && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }}>
                <Icon name="eye" size={15} />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputWithIconRightStyle}
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 0 }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          )}

          {/* Terms — sign-up only */}
          {isSignUp && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ border: '1px solid var(--line-1)', borderRadius: 6, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--surface-sunken)', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-app)',
                  }}
                >
                  <span>View Terms of Use &amp; User Agreement</span>
                  {showTerms ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showTerms && (
                  <pre style={{
                    padding: '12px', fontSize: 11, color: 'var(--text-2)',
                    background: 'var(--surface-panel)', maxHeight: 180, overflowY: 'auto',
                    whiteSpace: 'pre-wrap', fontFamily: 'var(--font-app)', lineHeight: 1.5, margin: 0,
                  }}>
                    {TERMS_TEXT}
                  </pre>
                )}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: 2, accentColor: 'var(--accent-1)' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                  I have read and agree to the Terms of Use, including that the service is provided without warranty, and I consent to receiving service-related emails.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="r-btn r-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: 14 }}
          >
            {loading ? 'Processing…' : isSignUp ? 'Create Account' : 'Sign in'}
          </button>
        </form>

        {/* Forgot password */}
        {!isSignUp && (
          <div style={{ textAlign: 'center' }}>
            {forgotSent ? (
              <p style={{ fontSize: 13, color: 'var(--success)', margin: 0 }}>Reset link sent — check your inbox.</p>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-3)', fontFamily: 'var(--font-app)' }}
              >
                Forgot password?
              </button>
            )}
          </div>
        )}

        {/* Toggle sign-in / sign-up */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => switchMode(!isSignUp)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--accent-2)', fontFamily: 'var(--font-app)' }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
