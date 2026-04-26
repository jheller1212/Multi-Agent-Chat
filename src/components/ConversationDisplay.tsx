import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface ConversationDisplayProps {
  messages: Message[];
  isLoading?: boolean;
  botName1: string;
  botName2: string;
  bubbleColor1: string;
  bubbleColor2: string;
  textColor1: string;
  textColor2: string;
  scenarioCards?: React.ReactNode;
}

function estimateTokens(wordCount: number) {
  return Math.ceil(wordCount * 1.33);
}

function TokenBadge({ wordCount }: { wordCount: number }) {
  const tokens = estimateTokens(wordCount);
  return (
    <div className="relative group inline-flex items-center">
      <span className="text-xs cursor-help underline decoration-dotted" style={{ color: 'inherit', opacity: 0.6 }}>
        ~{tokens} tokens
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none text-center leading-relaxed">
        Estimated token count (~{wordCount} words × 1.33).
        <br />
        For exact counts use{' '}
        <span className="underline">platform.openai.com/tokenizer</span>
      </div>
    </div>
  );
}

export function ConversationDisplay({
  messages,
  isLoading = false,
  botName1,
  botName2,
  bubbleColor1,
  bubbleColor2,
  textColor1,
  textColor2,
  scenarioCards,
}: ConversationDisplayProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const visible = messages.filter(m => m.role !== 'system' && !m.hidden);

  if (visible.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
        <Bot className="w-12 h-12 mb-3" />
        <p className="text-sm mb-6">Send a message (or leave blank) to start the conversation.</p>
        {scenarioCards}
      </div>
    );
  }

  // Build a map of conversationId → repetition number so we can show dividers
  // between runs when the user has configured multiple repetitions.
  const convIdToRepNum = new Map<string, number>();
  visible.forEach(m => {
    if (m.conversationId && !convIdToRepNum.has(m.conversationId)) {
      convIdToRepNum.set(m.conversationId, convIdToRepNum.size + 1);
    }
  });
  const hasMultipleReps = convIdToRepNum.size > 1;

  return (
    <div className="flex flex-col gap-2.5">
      {visible.map((message, idx) => {
        const isUser = message.role === 'user';
        const isBot1 = message.role === 'assistant' && message.botIndex === 1;
        const label = isUser ? 'You' : (isBot1 ? botName1 : botName2);

        // Show a repetition divider whenever the conversationId changes
        const prevMsg = idx > 0 ? visible[idx - 1] : null;
        const repNum = message.conversationId ? convIdToRepNum.get(message.conversationId) : undefined;
        const prevRepNum = prevMsg?.conversationId ? convIdToRepNum.get(prevMsg.conversationId) : undefined;
        const showRepDivider = hasMultipleReps && repNum != null && repNum > 1 && repNum !== prevRepNum;

        const repDivider = showRepDivider ? (
          <div key={`rep-${message.id}`} className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium px-2">Run {repNum}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
          </div>
        ) : null;

        if (isUser) {
          return (
            <React.Fragment key={message.id}>
              {repDivider}
              <div
                className="flex flex-col gap-1 px-3 py-2 rounded-xl shadow-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 mr-12"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </React.Fragment>
          );
        }

        const bgColor = isBot1 ? bubbleColor1 : bubbleColor2;
        const fgColor = isBot1 ? textColor1 : textColor2;

        return (
          <React.Fragment key={message.id}>
            {repDivider}
          <div
            className={`flex flex-col gap-1 px-3 py-2 rounded-xl shadow-sm ${isBot1 ? 'ml-12' : 'mr-12'}`}
            style={{ backgroundColor: bgColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" style={{ color: fgColor, opacity: 0.7 }} />
                <span className="text-sm font-semibold" style={{ color: fgColor }}>{label}</span>
                {message.wordCount != null && message.timeTaken != null && (
                  <span className="text-[11px] flex items-center gap-1.5" style={{ color: fgColor, opacity: 0.45 }}>
                    <span>{message.wordCount}w</span>
                    <span>·</span>
                    <TokenBadge wordCount={message.wordCount} />
                    <span>·</span>
                    <span>{(message.timeTaken / 1000).toFixed(1)}s</span>
                  </span>
                )}
              </div>
              <span className="text-[11px]" style={{ color: fgColor, opacity: 0.45 }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: fgColor }}>{message.content}</p>
          </div>
          </React.Fragment>
        );
      })}

      {isLoading && (
        <div className="flex items-center gap-2 ml-12 text-sm text-gray-400 dark:text-gray-500">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          Generating…
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
