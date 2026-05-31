import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ============================================================
// Types
// ============================================================

interface ChatMessage {
  id: string;
  sender: 'client' | 'worker';
  content: string;
  time: string;
}

interface Conversation {
  id: string;
  clientName: string;
  clientAvatar: string;
  lastMessage: string;
  timeAgo: string;
  unread: number;
  messages: ChatMessage[];
}

// ============================================================
// Mock Data
// ============================================================

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    clientName: 'Maria Santos',
    clientAvatar: 'https://i.pravatar.cc/40?img=5',
    lastMessage: 'Hi, are you available tomorrow for a plumbing job?',
    timeAgo: '2 min ago',
    unread: 2,
    messages: [
      { id: 'm1', sender: 'client', content: 'Hi! I need help with my kitchen sink', time: '10:30 AM' },
      { id: 'm2', sender: 'worker', content: 'Hello! What seems to be the problem?', time: '10:32 AM' },
      { id: 'm3', sender: 'client', content: 'The faucet is leaking badly', time: '10:33 AM' },
      { id: 'm4', sender: 'client', content: 'Hi, are you available tomorrow for a plumbing job?', time: '10:45 AM' },
    ],
  },
  {
    id: 'conv-2',
    clientName: 'Roberto Cruz',
    clientAvatar: 'https://i.pravatar.cc/40?img=12',
    lastMessage: 'Thanks for the great work yesterday!',
    timeAgo: '1 hour ago',
    unread: 0,
    messages: [
      { id: 'm5', sender: 'client', content: 'Can you come check my electrical wiring?', time: '9:00 AM' },
      { id: 'm6', sender: 'worker', content: 'Sure, I can come this afternoon', time: '9:15 AM' },
      { id: 'm7', sender: 'client', content: 'Thanks for the great work yesterday!', time: '5:00 PM' },
    ],
  },
  {
    id: 'conv-3',
    clientName: 'Elena Ramos',
    clientAvatar: 'https://i.pravatar.cc/40?img=32',
    lastMessage: 'How much would it cost to fix a broken pipe?',
    timeAgo: '3 hours ago',
    unread: 1,
    messages: [
      { id: 'm8', sender: 'client', content: 'How much would it cost to fix a broken pipe?', time: '7:00 AM' },
    ],
  },
];

// ============================================================
// Typing Indicator Component
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
// WorkerMessages Page
// ============================================================

export default function WorkerMessages() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, showTyping]);

  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    setMobileShowChat(true);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c))
    );
  };

  const handleBack = () => {
    setMobileShowChat(false);
    setActiveConvId(null);
  };

  const handleSend = () => {
    if (!newMsg.trim() || !activeConvId) return;

    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'worker',
      content: newMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, messages: [...c.messages, newMessage], lastMessage: newMessage.content, timeAgo: 'Just now' }
          : c
      )
    );
    setNewMsg('');

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

  // ============================================================
  // Conversation List Panel
  // ============================================================

  const ConversationList = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 shrink-0">
        <Link
          to="/dashboard/worker"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          aria-label="Back to dashboard"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-gray-900">💬 Messages</h1>
      </div>

      {/* Conversation items */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => handleSelectConversation(conv.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${
              activeConvId === conv.id ? 'bg-blue-50' : ''
            }`}
          >
            <img
              src={conv.clientAvatar}
              alt={conv.clientName}
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 truncate">{conv.clientName}</p>
                <span className="text-[11px] text-gray-400 shrink-0 ml-2">{conv.timeAgo}</span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
            </div>
            {conv.unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                {conv.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // ============================================================
  // Chat Panel
  // ============================================================

  const ChatPanel = () => {
    if (!activeConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center animate-fade-in">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-500 text-sm">Select a conversation to start chatting</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-gray-50 animate-fade-in">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          {/* Back button only on mobile */}
          <button
            onClick={handleBack}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-full transition-colors md:hidden"
            aria-label="Back to conversations"
          >
            ←
          </button>
          <img
            src={activeConversation.clientAvatar}
            alt={activeConversation.clientName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">{activeConversation.clientName}</p>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activeConversation.messages.map((msg) => {
            const isWorker = msg.sender === 'worker';
            return (
              <div
                key={msg.id}
                className={`flex ${isWorker ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isWorker
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isWorker ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {msg.time}
                  </p>
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
              disabled={!newMsg.trim()}
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
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Desktop: side-by-side layout */}
      {/* Mobile: show list or chat based on state */}

      {/* Conversation List */}
      <div
        className={`${
          mobileShowChat ? 'hidden' : 'flex'
        } md:flex md:w-[340px] md:border-r md:border-gray-200 h-full flex-col shrink-0`}
      >
        <ConversationList />
      </div>

      {/* Chat Panel */}
      <div
        className={`${
          mobileShowChat ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col h-full`}
      >
        <ChatPanel />
      </div>
    </div>
  );
}
