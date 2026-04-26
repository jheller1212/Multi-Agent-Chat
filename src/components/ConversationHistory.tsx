import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Clock, Bot, ChevronRight, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import type { Message } from '../types';

interface DbConversation {
  id: string;
  title: string | null;
  model1_type: string;
  model1_version: string;
  model2_type: string;
  model2_version: string;
  created_at: string;
  messages: { count: number }[];
}

interface DbMessage {
  id: string;
  role: string;
  model: string;
  content: string;
  word_count: number;
  time_taken: number;
  created_at: string;
}

interface ConversationHistoryProps {
  userId: string;
  onClose: () => void;
  onLoad: (messages: Message[]) => void;
}

const MODEL_LABELS: Record<string, string> = {
  gpt4: 'GPT-4',
  claude: 'Claude',
  gemini: 'Gemini',
  mistral: 'Mistral',
};

export function ConversationHistory({ userId, onClose, onLoad }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Single query with embedded message count — avoids N+1 queries
        const { data, error } = await supabase
          .from('conversations')
          .select('id, title, model1_type, model1_version, model2_type, model2_version, created_at, messages(count)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setConversations((data as unknown as DbConversation[]) ?? []);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userId]);

  const handleSelectConversation = async (id: string) => {
    setSelectedId(id);
    setLoadingMessages(true);
    setMessagesError(null);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, role, model, content, word_count, time_taken, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSelectedMessages(data ?? []);
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleLoad = () => {
    const mapped: Message[] = selectedMessages.map((m) => ({
      id: m.id,
      role: (m.role === 'user' ? 'user' : 'assistant') as Message['role'],
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
      wordCount: m.word_count,
      timeTaken: m.time_taken,
    }));
    onLoad(mapped);
    onClose();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diffDays === 0) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      <div role="dialog" aria-modal="true" aria-labelledby="conv-history-title" className="ml-auto w-full max-w-3xl bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 id="conv-history-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">Conversation History</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* List */}
          <div className="w-72 border-r dark:border-gray-700 flex flex-col overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-12 text-red-500 text-sm px-6 text-center gap-2">
                <AlertCircle className="w-8 h-8" />
                {loadError}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 text-sm px-6 text-center">
                <MessageSquare className="w-10 h-10 mb-3" />
                No conversations yet. Start chatting to see your history here.
              </div>
            ) : (
              conversations.map((conv) => {
                const count = conv.messages?.[0]?.count ?? 0;
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedId === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate flex-1">
                        {conv.title ?? 'Untitled conversation'}
                      </p>
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Bot className="w-3 h-3" />
                      <span>{MODEL_LABELS[conv.model1_type] ?? conv.model1_type}</span>
                      <span className="text-gray-300 dark:text-gray-600">×</span>
                      <span>{MODEL_LABELS[conv.model2_type] ?? conv.model2_type}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-400 dark:text-gray-500">
                      <span>{formatDate(conv.created_at)}</span>
                      <span>{count} msg{count !== 1 ? 's' : ''}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedId ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
                <MessageSquare className="w-10 h-10 mb-3" />
                Select a conversation to preview it
              </div>
            ) : loadingMessages ? (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : messagesError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500 text-sm gap-2">
                <AlertCircle className="w-8 h-8" />
                {messagesError}
              </div>
            ) : (
              <>
                {selected && (
                  <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-indigo-700 dark:text-indigo-400">
                        {MODEL_LABELS[selected.model1_type] ?? selected.model1_type} ({selected.model1_version})
                      </span>
                      <span className="mx-2 text-gray-400 dark:text-gray-500">vs</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {MODEL_LABELS[selected.model2_type] ?? selected.model2_type} ({selected.model2_version})
                      </span>
                    </div>
                    <button
                      onClick={handleLoad}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      Load into Chat
                    </button>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 mr-8'
                          : 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 ml-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {msg.model || (msg.role === 'user' ? 'User' : 'Assistant')}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
