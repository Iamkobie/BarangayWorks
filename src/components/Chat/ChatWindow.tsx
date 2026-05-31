import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  sendMessage,
  getConversation,
  subscribeToMessages,
  type Message,
} from '../../services/messaging';

// ============================================================
// Typing Indicator
// ============================================================

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-gray-200 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// ============================================================
// ChatWindow Component
// ============================================================

export default function ChatWindow() {
  const { userId: otherUserId } = useParams<{ userId: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock worker info for the header
  const workerInfo = {
    name: 'Service Provider',
    avatar: 'https://i.pravatar.cc/40?img=8',
  };

  useEffect(() => {
    if (!otherUserId) return;
    loadMessages();

    const channel = subscribeToMessages(otherUserId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  const loadMessages = async () => {
    if (!otherUserId) return;
    setIsLoading(true);
    const { data } = await getConversation(otherUserId);
    setMessages(data);
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !otherUserId) return;
    setIsSending(true);
    const { localMessage } = await sendMessage(otherUserId, newMsg.trim());
    if (localMessage) {
      setMessages((prev) => [...prev, localMessage]);
      setNewMsg('');
    }
    setIsSending(false);

    // Show typing indicator briefly
    setShowTyping(true);
    setTimeout(() => setShowTyping(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with worker info */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        <Link
          to="/dashboard"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          aria-label="Back"
        >
          ←
        </Link>
        <img
          src={workerInfo.avatar}
          alt={workerInfo.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{workerInfo.name}</p>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-gray-600 text-sm font-medium">Start a conversation!</p>
            <p className="text-gray-400 text-xs mt-1 max-w-[250px]">
              Ask about availability, pricing, or schedule a job.
            </p>
          </div>
        )}
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === user?.id || msg.sender_id === 'demo-user';
          const isLast = index === messages.length - 1;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className="flex flex-col">
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMine
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {/* Delivered status for sent messages */}
                {isMine && isLast && (
                  <p className="text-[10px] text-gray-400 mt-0.5 text-right">Delivered</p>
                )}
              </div>
            </div>
          );
        })}
        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Attach button (non-functional, UI only) */}
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Attach file"
            type="button"
          >
            📎
          </button>
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-h-[44px] px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !newMsg.trim()}
            className="min-w-[44px] min-h-[44px] bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors active:scale-95"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
