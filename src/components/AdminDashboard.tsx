import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, MessageSquare, FlaskConical, GraduationCap, BarChart3, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workshop-config`;

type Period = 'day' | 'week' | 'month' | 'all';

interface AdminStats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalExperiments: number;
  activeWorkshops: number;
  inactiveWorkshops: number;
  totalSignups: number;
  conversationsByDay: Array<{ day: string; count: number }>;
  signupsByWorkshop: Array<{ workshop_code: string; count: number }>;
  recentSignups: Array<{ user_id: string; workshop_code: string; created_at: string }>;
}

interface AdminDashboardProps {
  onClose: () => void;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const periodLabels: Record<Period, string> = {
  day: 'Today',
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('week');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const resp = await fetch(EDGE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'admin-stats', period }),
        });

        const result = await resp.json();
        if (!resp.ok || result.error) throw new Error(result.error || `HTTP ${resp.status}`);
        setStats(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [period]);

  const maxBarValue = useMemo(() => {
    if (!stats?.conversationsByDay.length) return 1;
    return Math.max(...stats.conversationsByDay.map(d => d.count), 1);
  }, [stats]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Period filter */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(['day', 'week', 'month', 'all'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    period === p
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Loading analytics...</p>
          ) : error ? (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">{error}</div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={<Users className="w-4 h-4" />} label="Total Users" value={stats.totalUsers} />
                <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Conversations" value={stats.totalConversations} sub="started" />
                <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Messages" value={stats.totalMessages} sub="individual bot + user msgs" />
                <StatCard icon={<FlaskConical className="w-4 h-4" />} label="Experiments" value={stats.totalExperiments} />
                <StatCard
                  icon={<GraduationCap className="w-4 h-4" />}
                  label="Workshops"
                  value={`${stats.activeWorkshops} / ${stats.activeWorkshops + stats.inactiveWorkshops}`}
                  sub={`${stats.activeWorkshops} active`}
                />
                <StatCard icon={<UserPlus className="w-4 h-4" />} label="Workshop Sign-ups" value={stats.totalSignups} />
              </div>

              {/* Conversations by day chart */}
              {stats.conversationsByDay.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Conversations by Day</h3>
                  <div className="space-y-1">
                    {stats.conversationsByDay.map(({ day, count }) => (
                      <div key={day} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500 dark:text-gray-400 w-20 text-xs shrink-0">{formatDay(day)}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max((count / maxBarValue) * 100, 2)}%` }}
                          />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium w-8 text-right text-xs">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign-ups by workshop */}
              {stats.signupsByWorkshop.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sign-ups by Workshop</h3>
                  <div className="space-y-2 text-sm">
                    {stats.signupsByWorkshop.map(({ workshop_code, count }) => (
                      <div key={workshop_code} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">{workshop_code}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent sign-ups */}
              {stats.recentSignups.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Sign-ups</h3>
                  <div className="space-y-2">
                    {stats.recentSignups.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{s.workshop_code}</span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs truncate max-w-[180px]">{s.user_id.slice(0, 8)}...</span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</div>}
    </div>
  );
}
