import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { streamChat } from '@/api/client';
import type { ChatStreamEvent } from '@/api/client';
import { buildSystemPrompt } from '../prompt/system-prompt';
import { MessageList } from './MessageList';
import type { FMContext } from '@/context/types';
import type { StepInfo } from '@/api/client';

interface ChatPanelProps {
  context: FMContext | null;
  steps: StepInfo[];
  editorContent: string;
  onInsertScript?: (script: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export function ChatPanel({ context, steps, editorContent, onInsertScript }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    const systemPrompt = buildSystemPrompt({ context, steps });

    // Include editor content as context
    const contextMsg = editorContent
      ? `\n\nCurrent editor content:\n\`\`\`\n${editorContent}\n\`\`\``
      : '';

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: text + contextMsg },
    ];

    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    // Add empty assistant message for streaming
    const assistantIdx = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      await streamChat(
        apiMessages,
        (event: ChatStreamEvent) => {
          if (event.type === 'text' && event.text) {
            setMessages(prev => {
              const updated = [...prev];
              updated[assistantIdx] = {
                ...updated[assistantIdx],
                content: updated[assistantIdx].content + event.text,
              };
              return updated;
            });
          } else if (event.type === 'error') {
            setMessages(prev => {
              const updated = [...prev];
              updated[assistantIdx] = {
                ...updated[assistantIdx],
                content: updated[assistantIdx].content + `\n\nError: ${event.error}`,
                streaming: false,
              };
              return updated;
            });
          } else if (event.type === 'done') {
            setMessages(prev => {
              const updated = [...prev];
              updated[assistantIdx] = { ...updated[assistantIdx], streaming: false };
              return updated;
            });
          }
        },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          updated[assistantIdx] = {
            ...updated[assistantIdx],
            content: updated[assistantIdx].content + `\n\nError: ${err}`,
            streaming: false,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, context, steps, editorContent]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div class="flex flex-col h-full bg-neutral-900 border-l border-neutral-700">
      <div class="px-3 py-1.5 bg-neutral-800 border-b border-neutral-700 text-xs text-neutral-400 select-none">
        AI Chat
      </div>

      <MessageList messages={messages} onInsertScript={onInsertScript} />

      <div class="border-t border-neutral-700 p-2">
        <div class="flex gap-2">
          <textarea
            ref={inputRef}
            class="flex-1 bg-neutral-800 text-neutral-200 text-sm rounded px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-500"
            rows={2}
            placeholder="Ask about FileMaker scripting..."
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              class="self-end px-3 py-2 rounded text-xs bg-red-700 hover:bg-red-600 text-white"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={sendMessage}
              class="self-end px-3 py-2 rounded text-xs bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-50"
              disabled={!input.trim()}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
