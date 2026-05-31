import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Send a message to another user.
 * Always attempts to insert into Supabase.
 * Returns a local message object for optimistic UI regardless.
 */
export async function sendMessage(
  receiverId: string,
  content: string
): Promise<{ error?: string; localMessage?: Message }> {
  const { data: { user } } = await supabase.auth.getUser();
  const senderId = user?.id || 'demo-user';

  const localMsg: Message = {
    id: `local-${Date.now()}`,
    sender_id: senderId,
    receiver_id: receiverId,
    content,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  // Always try to insert into DB
  try {
    const { error } = await supabase.from('messages').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      is_read: false,
    });
    if (error) {
      console.warn('Message insert failed:', error.message);
    }
  } catch (err) {
    // Silently fail for demo mode
    console.warn('Message send error:', err);
  }

  return { localMessage: localMsg };
}

/**
 * Get conversation messages between current user and another user.
 * Uses auth user IDs (not worker table IDs).
 */
export async function getConversation(
  otherUserId: string
): Promise<{ data: Message[]; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: (data as Message[]) || [] };
  } catch {
    return { data: [] };
  }
}

/**
 * Get all messages involving the current user (for inbox view).
 */
export async function getAllMessages(): Promise<{ data: Message[]; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: (data as Message[]) || [] };
  } catch {
    return { data: [] };
  }
}

/**
 * Subscribe to new messages in a conversation via Supabase Realtime.
 * Returns the channel for cleanup. Silently handles connection failures.
 */
export function subscribeToMessages(
  otherUserId: string,
  onNewMessage: (message: Message) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${otherUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        const msg = payload.new as Message;
        onNewMessage(msg);
      }
    )
    .subscribe();

  return channel;
}
