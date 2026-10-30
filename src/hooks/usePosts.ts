import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PostWithProfile } from '../types/database';
import { useAuth } from '../context/AuthContext';

export function useFeed() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<PostWithProfile[]>({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (id, username, display_name, avatar_url, is_verified)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      if (!user || !data) return data as PostWithProfile[];

      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', data.map((p) => p.id));

      const likedSet = new Set((likes ?? []).map((l) => l.post_id));
      return data.map((p) => ({ ...p, liked_by_me: likedSet.has(p.id) })) as PostWithProfile[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        qc.invalidateQueries({ queryKey: ['feed'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useUserPosts(userId: string) {
  return useQuery<PostWithProfile[]>({
    queryKey: ['posts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`*, profiles (id, username, display_name, avatar_url, is_verified)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PostWithProfile[];
    },
    enabled: !!userId,
  });
}

export function useToggleLike() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (liked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
        await supabase.rpc('decrement_like_count', { post_id: postId });
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
        await supabase.rpc('increment_like_count', { post_id: postId });
      }
    },
    onMutate: async ({ postId, liked }) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      const prev = qc.getQueryData<PostWithProfile[]>(['feed']);
      qc.setQueryData<PostWithProfile[]>(['feed'], (old) =>
        old?.map((p) =>
          p.id === postId
            ? { ...p, liked_by_me: !liked, like_count: p.like_count + (liked ? -1 : 1) }
            : p
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['feed'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useVideoFeed() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<PostWithProfile[]>({
    queryKey: ['videoFeed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (id, username, display_name, avatar_url, is_verified)
        `)
        .eq('media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      if (!user || !data) return data as PostWithProfile[];

      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', data.map((p) => p.id));

      const likedSet = new Set((likes ?? []).map((l) => l.post_id));
      return data.map((p) => ({ ...p, liked_by_me: likedSet.has(p.id) })) as PostWithProfile[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime:videos')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload: any) => {
        if (payload.new?.media_type === 'video') {
          qc.invalidateQueries({ queryKey: ['videoFeed'] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useSearchPosts(query: string) {
  const { user } = useAuth();

  return useQuery<PostWithProfile[]>({
    queryKey: ['searchPosts', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!inner (id, username, display_name, avatar_url, is_verified)
        `)
        .or(`caption.ilike.%${query}%,profiles.username.ilike.%${query}%,profiles.display_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;

      if (!user || !data) return data as PostWithProfile[];

      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', data.map((p) => p.id));

      const likedSet = new Set((likes ?? []).map((l) => l.post_id));
      return data.map((p) => ({ ...p, liked_by_me: likedSet.has(p.id) })) as PostWithProfile[];
    },
    enabled: !!user && query.length >= 2,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: {
      user_id: string;
      media_url: string;
      media_type: 'photo' | 'video';
      caption?: string;
    }) => {
      const { error } = await supabase.from('posts').insert({ ...post, is_verified_capture: true });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}
