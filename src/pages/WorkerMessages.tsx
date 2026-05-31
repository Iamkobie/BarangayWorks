import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import {
  sendMessage,
  getAllMessages,
  subscribeToMessages,
  type Message,
} from '../services/messaging';

// ============================================================
// Types
// ============================================================

interface ChatMessage {
  id: string;
  sender: 'client' | 'worker';
  content: string;
  time: string;
  created_at: string;
}

interface Conversation {
  id: string;
  otherUserId: string;
  clientName: string;
  clientAvatar: string;
  lastMessage: string;
  timeAgo: string;
  unread: number;
  messages: ChatMessage[];
}

// ============================================================
// Mock Data (fallback when no real messages exist)
// ============================================================

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    otherUserId: 'mock-user-1',
    clientName: 'Maria Santos',
    clientAvatar: 'https://i.pravatar.cc/40?img=5',
    lastMessage: 'Hi, are you available tomorrow for a plumbing job?',
    timeAgo: '2 min ago',
    unread: 2,
    messages: [
      { id: 'm1', sender: 'client', content: 'Hi! I need help with my kitchen sink', time: '10:30 AM', created_at: '2024-01-01T10:30:00Z' },
      { id: 'm2', sender: 'worker', content: 'Hello! What seems to be the problem?', time: '10:32 AM', created_at: '2024-01-01T10:32:00Z' },
      { id: 'm3', sender: 'client', content: 'The faucet is leaking badly', time: '10:33 AM', created_at: '2024-01-01T10:33:00Z' },
      { id: 'm4', sender: 'client', content: 'Hi, are you available tomorrow for a plumbing job?', time: '10:45 AM', created_at: '2024-01-01T10:45:00Z' },
    ],
  },
  {
    id: 'conv-2',
    otherUserId: 'mock-user-2',
    clientName: 'Roberto Cruz',
    clientAvatar: 'https://i.pravatar.cc/40?img=12',
    lastMessage: 'Thanks for the great work yesterday!',
    timeAgo: '1 hour ago',
    unread: 0,
    messages: [
      { id: 'm5', sender: 'client', content: 'Can you come check my electrical wiring?', time: '9:00 AM', created_at: '2024-01-01T09:00:00Z' },
      { id: 'm6', sender: 'worker', content: 'Sure, I can come this afternoon', time: '9:15 AM', created_at: '2024-01-01T09:15:00Z' },
      { id: 'm7', sender: 'client', content: 'Thanks for the great work yesterday!', time: '5:00 PM', created_at: '2024-01-01T17:00:00Z' },
    ],
  },
  {
    id: 'conv-3',
    otherUserId: 'mock-user-3',
    clientName: 'Elena Ramos',
    clientAvatar: 'https://i.pravatar.cc/40?img=32',
    lastMessage: 'How much would it cost to fix a broken pipe?',
    timeAgo: '3 hours ago',
    unread: 1,
    messages: [
      { id: 'm8', sender: 'client', content: 'How much would it cost to fix a broken pipe?', time: '7:00 AM', created_at: '2024-01-01T07:00:00Z' },
    ],
  },
];

// ============================================================
// Helper: format relative time
// ============================================================

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

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
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  // ============================================================
  // Load real messages from Supabase and group into conversations
  // ============================================================

  const loadRealMessages = useCallback(async () => {
    if (!user?.id) {
      setConversations(mockConversations);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data: allMessages } = await getAllMessages();

      if (!allMessages || allMessages.length === 0) {
        // No real messages — fall back to mock data for demo stability
        setConversations(mockConversations);
        setIsLoading(false);
        return;
      }

      // Group messages by the OTHER person in each conversation
      const conversationMap = new Map<string, Message[]>();

      for (const msg of allMessages) {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, []);
        }
        conversationMap.get(otherUserId)!.push(msg);
      }

      // Look up names for the other users (try users table first, then workers)
      const otherUserIds = Array.from(conversationMap.keys());

      // Try to get user emails from users table
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email')
        .in('id', otherUserIds);

      // Try to get worker names
      const { data: workersData } = await supabase
        .from('workers')
        .select('user_id, name')
        .in('user_id', otherUserIds);

      const userNameMap = new Map<string, string>();
      if (workersData) {
        for (const w of workersData) {
          userNameMap.set(w.user_id, w.name);
        }
      }
      if (usersData) {
        for (const u of usersData) {
          if (!userNameMap.has(u.id)) {
            // Use email prefix as name fallback
            userNameMap.set(u.id, u.email.split('@')[0]);
          }
        }
      }

      // Build conversation objects
      const convs: Conversation[] = [];
      let convIndex = 0;

      for (const [otherUserId, msgs] of conversationMap.entries()) {
        const sortedMsgs = msgs.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const lastMsg = sortedMsgs[sortedMsgs.length - 1];
        const unreadCount = sortedMsgs.filter(
          (m) => m.receiver_id === user.id && !m.is_read
        ).length;

        const clientName = userNameMap.get(otherUserId) || `User ${convIndex + 1}`;
        // Generate a consistent avatar based on the user ID
        const avatarSeed = Math.abs(otherUserId.charCodeAt(0) + otherUserId.charCodeAt(1)) % 70;

        const chatMessages: ChatMessage[] = sortedMsgs.map((m) => ({
          id: m.id,
          sender: m.sender_id === user.id ? 'worker' : 'client',
          content: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          created_at: m.created_at,
        }));

        convs.push({
          id: `conv-real-${otherUserId}`,
          otherUserId,
          clientName,
          clientAvatar: `https://i.pravatar.cc/40?img=${avatarSeed}`,
          lastMessage: lastMsg.content,
          timeAgo: formatTimeAgo(lastMsg.created_at),
          unread: unreadCount,
          messages: chatMessages,
        });

        convIndex++;
      }

      // Sort conversations by most recent message
      convs.sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.created_at || '';
        const bLast = b.messages[b.messages.length - 1]?.created_at || '';
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });

      setConversations(convs);
    } catch (err) {
      console.warn('Failed to load messages, using mock data:', err);
      setConversations(mockConversations);
    }

    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadRealMessages();
  }, [loadRealMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = subscribeToMessages(user.id, () => {
      // A new message arrived — reload conversations to stay in sync
      loadRealMessages();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, loadRealMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, showTyping]);

  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    setMobileShowChat(true);
    // Mark as read locally
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c))
    );

    // Mark messages as read in DB
    const conv = conversations.find((c) => c.id === convId);
    if (conv && user?.id) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', conv.otherUserId)
        .eq('is_read', false)
        .then(() => {});
    }
  };

  const handleBack = () => {
    setMobileShowChat(false);
    setActiveConvId(null);
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConversation) return;
    setIsSending(true);

    const otherUserId = activeConversation.otherUserId;

    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      sender: 'worker',
      content: newMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              messages: [...c.messages, optimisticMsg],
              lastMessage: optimisticMsg.content,
              timeAgo: 'Just now',
            }
          : c
      )
    );
    setNewMsg('');

    // Send to Supabase
    await sendMessage(otherUserId, optimisticMsg.content);

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

  // ============================================================
  // Loading State
  // ============================================================

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

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
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500 text-sm">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">Messages from clients will appear here</p>
          </div>
        )}
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
