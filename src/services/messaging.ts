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
 */
export async function sendMessage(
  receiverId: string,
  content: string
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('messages').insert({
    sender_id: user.id,
    receiver_id: receiverId,
    content,
    is_read: false,
  });

  if (error) return { error: error.message };
  return {};
}

/**
 * Get conversation messages between current user and another user.
 */
export async function getConversation(
  otherUserId: string
): Promise<{ data: Message[]; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data as Message[]) || [] };
}

/**
 * Subscribe to new messages in a conversation via Supabase Realtime.
 * Returns the channel for cleanup.
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
