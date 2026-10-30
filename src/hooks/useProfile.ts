import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { useAuth } from '../context/AuthContext';

export function useProfile(userId: string) {
  return useQuery<Profile>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
}

export function useFollowStatus(targetUserId: string) {
  const { user } = useAuth();
  return useQuery<boolean>({
    queryKey: ['follow', user?.id, targetUserId],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetId, isFollowing }: { targetId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
        await supabase.rpc('decrement_follow_counts', { follower: user.id, following: targetId });
      } else {
        await (supabase as any).from('follows').insert({ follower_id: user.id, following_id: targetId });
        await supabase.rpc('increment_follow_counts', { follower: user.id, following: targetId });
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['follow', user?.id, vars.targetId] });
      qc.invalidateQueries({ queryKey: ['profile', vars.targetId] });
      qc.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export function useUpdateProfile() {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { display_name?: string; bio?: string; username?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: ['profile', user.id] });
      refreshProfile();
    },
  });
}
