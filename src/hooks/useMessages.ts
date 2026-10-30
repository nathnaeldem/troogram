import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Message, ConversationWithProfile } from '../types/database';
import { useAuth } from '../context/AuthContext';

export function useConversations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<ConversationWithProfile[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_one_profile:profiles!conversations_participant_one_fkey (id, username, display_name, avatar_url, is_verified),
          participant_two_profile:profiles!conversations_participant_two_fkey (id, username, display_name, avatar_url, is_verified),
          messages (content, created_at)
        `)
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      if (error) throw error;

      return (data as any[]).map((conv) => {
        const isOne = conv.participant_one === user.id;
        const other = isOne ? conv.participant_two_profile : conv.participant_one_profile;
        const msgs: any[] = conv.messages ?? [];
        const last = msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        return {
          ...conv,
          other_user: other,
          last_message: last?.content,
        } as ConversationWithProfile;
      });
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('realtime:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        qc.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return query;
}

export function useMessages(conversationId: string) {
  const qc = useQueryClient();

  const query = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`realtime:messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        qc.setQueryData<Message[]>(['messages', conversationId], (old) => [
          ...(old ?? []),
          payload.new as Message,
        ]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  return query;
}

export function useSendMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase as any)
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, content });
      if (error) throw error;
      await (supabase as any)
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useOrCreateConversation() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (otherUserId: string): Promise<string> => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`
        )
        .single();

      if (existing) return (existing as any).id;

      const { data: created, error } = await (supabase as any)
        .from('conversations')
        .insert({ participant_one: user.id, participant_two: otherUserId })
        .select('id')
        .single();
      if (error) throw error;
      return created.id;
    },
  });
}
