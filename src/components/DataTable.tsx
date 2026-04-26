import React from 'react';
import { Message } from '../types';

interface DataTableProps {
  messages: Message[];
  botName1: string;
  botName2: string;
}

export function DataTable({ messages, botName1, botName2 }: DataTableProps) {
  const rows = messages.filter(m => m.role !== 'system' && !m.hidden);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
        <p>No messages yet. Start a conversation to see live data here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="min-w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
          <tr>
            {['Conv. ID', 'Time', 'Sender', 'Model', 'Temp', 'Words', 'ms', 'Message'].map(col => (
              <th
                key={col}
                className="px-2 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => {
            const sender = m.role === 'user' ? 'You' : (m.botIndex === 1 ? botName1 : botName2);
            const isUser = m.role === 'user';
            return (
              <tr key={m.id} className={`border-b border-gray-100 dark:border-gray-700 ${i % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-700/40'}`}>
                <td className="px-2 py-1.5 font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {m.conversationId ? m.conversationId.slice(0, 8) : '—'}
                </td>
                <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-2 py-1.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{sender}</td>
                <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{m.modelVersion ?? '—'}</td>
                <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {isUser ? '—' : (m.temperature != null ? m.temperature : '—')}
                </td>
                <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{m.wordCount ?? '—'}</td>
                <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {isUser ? '—' : (m.timeTaken ?? '—')}
                </td>
                <td
                  className="px-2 py-1.5 text-gray-700 dark:text-gray-300 max-w-sm truncate"
                  title={m.content}
                >
                  {m.content}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
