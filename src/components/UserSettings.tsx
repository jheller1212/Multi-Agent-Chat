import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { X, Settings, User as UserIcon, Mail, Lock, Save, Clock, Trash2, KeyRound, PlayCircle, GraduationCap, Ticket, BarChart3 } from 'lucide-react';
import { loadVault, saveVault, clearVault, type ProviderVault } from '../lib/apiKeyVault';

interface UserSettingsProps {
  user: User;
  onClose: () => void;
  onOpenHistory?: () => void;
  onDataDeleted?: () => void;
  onAccountDeleted?: () => void;
  onRewatchTour?: () => void;
  isOrganizer?: boolean;
  onOpenWorkshops?: () => void;
  onOpenAdmin?: () => void;
}

export function UserSettings({ user, onClose, onOpenHistory, onDataDeleted, onAccountDeleted, onRewatchTour, isOrganizer, onOpenWorkshops, onOpenAdmin }: UserSettingsProps) {
  const [displayName, setDisplayName] = useState(user.user_metadata?.display_name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
  const [deleting, setDeleting] = useState(false);
  const [deleteAccountStep, setDeleteAccountStep] = useState<'idle' | 'confirm'>('idle');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [vault, setVault] = useState<ProviderVault>(() => loadVault());
  const [inviteCode, setInviteCode] = useState('');
  const [inviteMessage, setInviteMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [redeemingInvite, setRedeemingInvite] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleVaultChange = (provider: keyof ProviderVault, value: string) => {
    const updated = { ...vault, [provider]: value };
    setVault(updated);
    saveVault(updated);
  };

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (displayName !== (user.user_metadata?.display_name ?? '')) {
        const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
        if (error) throw error;
      }

      const updates: { email?: string; password?: string } = {};
      if (email !== user.email) updates.email = email;
      if (newPassword) updates.password = newPassword;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
      }

      setMessage({ text: 'Settings saved! Check your email if you changed it.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
      onDataDeleted?.();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to delete data', type: 'error' });
      setDeleteStep('idle');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      clearVault();
      // User is already deleted server-side; sign out locally only (no server round-trip)
      await supabase.auth.signOut({ scope: 'local' });
      onAccountDeleted?.();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to delete account', type: 'error' });
      setDeleteAccountStep('idle');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="user-settings-title" className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 id="user-settings-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className={`sticky top-0 z-10 px-6 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-b border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-b border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{user.email}</span></p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Display Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Your display name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">New Password <span className="text-gray-400 dark:text-gray-500">(leave blank to keep current)</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="New password"
              />
            </div>
          </div>

          {newPassword && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          )}
        </div>

        {(onOpenHistory || onRewatchTour) && (
          <div className="px-6 pb-4 pt-2 space-y-2">
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm"
              >
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Conversation History</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">View all past conversations →</span>
              </button>
            )}
            {onRewatchTour && (
              <button
                onClick={() => { onRewatchTour(); onClose(); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm"
              >
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <PlayCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Rewatch App Tour</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">Replay the onboarding tour →</span>
              </button>
            )}
          </div>
        )}

        {/* Admin: Analytics & Workshops */}
        {isOrganizer && (onOpenAdmin || onOpenWorkshops) && (
          <div className="px-6 pb-4 pt-2 space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Organizer Tools</p>
            {onOpenAdmin && (
              <button
                onClick={() => { onOpenAdmin(); onClose(); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-sm"
              >
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <BarChart3 className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  <span>Analytics Dashboard</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">Usage stats & insights →</span>
              </button>
            )}
            {onOpenWorkshops && (
              <button
                onClick={() => { onOpenWorkshops(); onClose(); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-sky-300 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors text-sm"
              >
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <GraduationCap className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  <span>Workshop Manager</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">Create & manage workshops →</span>
              </button>
            )}
          </div>
        )}

        {/* API Key Vault */}
        <div className="px-6 pb-4 pt-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Saved API Keys</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Store one key per provider. When you switch a bot's provider, its key is filled in automatically. Keys are encrypted and stored securely so they persist across sessions and devices.
            </p>
            {(
              [
                { provider: 'gpt4' as const, label: 'OpenAI', placeholder: 'sk-...' },
                { provider: 'claude' as const, label: 'Anthropic', placeholder: 'sk-ant-...' },
                { provider: 'gemini' as const, label: 'Google Gemini', placeholder: 'AIza...' },
                { provider: 'mistral' as const, label: 'Mistral', placeholder: 'Your Mistral API key' },
              ] as const
            ).map(({ provider, label, placeholder }) => (
              <div key={provider} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{label}</span>
                <input
                  type="password"
                  value={vault[provider]}
                  onChange={(e) => handleVaultChange(provider, e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={placeholder}
                />
              </div>
            ))}
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Avoid saving keys on shared or public computers.
            </p>
          </div>
        </div>

        {/* Workshop Organizer Invite */}
        <div className="px-6 pb-4 pt-2">
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Workshop Organizer Access</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Have an invite code? Enter it below to become a workshop organizer and create workshop sessions with pre-loaded API keys.
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 uppercase tracking-wider"
                />
              </div>
              <button
                onClick={async () => {
                  if (!inviteCode.trim()) return;
                  setRedeemingInvite(true);
                  setInviteMessage(null);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error('Not authenticated');
                    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workshop-config`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                      body: JSON.stringify({ action: 'redeem-invite', code: inviteCode }),
                    });
                    const result = await resp.json();
                    if (!resp.ok || result.error) throw new Error(result.error || 'Failed');
                    setInviteMessage({ text: 'You are now a workshop organizer! Reload the page to see the Workshops button.', type: 'success' });
                    setInviteCode('');
                  } catch (e) {
                    setInviteMessage({ text: e instanceof Error ? e.message : 'Failed to redeem code', type: 'error' });
                  } finally {
                    setRedeemingInvite(false);
                  }
                }}
                disabled={redeemingInvite || !inviteCode.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {redeemingInvite ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>
            {inviteMessage && (
              <p className={`text-xs ${inviteMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {inviteMessage.text}
              </p>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="px-6 pb-4 pt-2">
          <div className="rounded-xl border border-red-200 dark:border-red-800 p-4 space-y-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Danger Zone</p>

            {/* Delete conversation history */}
            {deleteStep === 'idle' ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Permanently delete all your conversation history. Your account remains active.
                </p>
                <button
                  onClick={() => setDeleteStep('confirm')}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete all data
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  This will permanently delete all your conversations and messages. Your account will remain active. Are you sure?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteStep('idle')}
                    disabled={deleting}
                    className="flex-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllData}
                    disabled={deleting}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deleting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    {deleting ? 'Deleting…' : 'Yes, delete everything'}
                  </button>
                </div>
              </div>
            )}

            <hr className="border-red-100 dark:border-red-900" />

            {/* Delete account */}
            {deleteAccountStep === 'idle' ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
                <button
                  onClick={() => setDeleteAccountStep('confirm')}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Account
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  This will permanently delete your account and all your data. You will be signed out immediately. <strong>This cannot be undone.</strong>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteAccountStep('idle')}
                    disabled={deletingAccount}
                    className="flex-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deletingAccount ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    {deletingAccount ? 'Deleting…' : 'Yes, delete my account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
