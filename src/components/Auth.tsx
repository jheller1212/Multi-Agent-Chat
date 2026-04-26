import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
          <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-gray-600">
              We sent a confirmation link to <span className="font-medium">{email}</span>.
              Click the link to activate your account, then come back and sign in.
            </p>
          </div>
          <button
            onClick={() => { setAwaitingConfirmation(false); switchMode(false); }}
            className="w-full py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        {workshopInfo && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center space-y-1">
            <h3 className="text-lg font-semibold text-indigo-900">{workshopInfo.name}</h3>
            {workshopInfo.welcome && (
              <p className="text-sm text-indigo-700">{workshopInfo.welcome}</p>
            )}
          </div>
        )}
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to AI2AI Chat'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* OAuth buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <GitHubIcon />
            Continue with GitHub
          </button>
          {isSignUp && (
            <p className="text-xs text-gray-500 text-center">
              By continuing with Google or GitHub, you agree to our Terms of Use and Privacy Policy.
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400">or continue with email</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-lg block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Email address"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-lg block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Password (min 6 characters)"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Confirm password — sign-up only */}
          {isSignUp && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-lg block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}

          {/* Terms & Conditions — sign-up only */}
          {isSignUp && (
            <div className="space-y-2">
              {/* Expandable terms box */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span>View Terms of Use &amp; User Agreement</span>
                  {showTerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showTerms && (
                  <pre className="px-4 py-3 text-xs text-gray-600 bg-white max-h-48 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                    {TERMS_TEXT}
                  </pre>
                )}
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">
                  I have read and agree to the Terms of Use, including that the service is provided without warranty, and I consent to receiving service-related emails.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing…' : isSignUp ? 'Create Account' : 'Sign in'}
          </button>
        </form>

        {!isSignUp && (
          <div className="text-center space-y-1">
            {forgotSent ? (
              <p className="text-sm text-emerald-600">Reset link sent — check your inbox.</p>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-indigo-600 disabled:opacity-50"
              >
                Forgot password?
              </button>
            )}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => switchMode(!isSignUp)}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
