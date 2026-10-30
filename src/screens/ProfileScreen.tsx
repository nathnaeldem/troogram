import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useProfile, useFollowStatus, useToggleFollow } from '../hooks/useProfile';
import { useUserPosts } from '../hooks/usePosts';
import { useOrCreateConversation } from '../hooks/useMessages';
import Avatar from '../components/Avatar';
import { Colors, FontSize, Spacing, Radius } from '../theme/colors';
import { PostWithProfile } from '../types/database';

const { width } = Dimensions.get('window');
const TILE = (width - 3) / 3;

type ProfileRouteParams = {
  ProfileView: { userId: string };
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { user, profile: myProfile, signOut } = useAuth();

  const isOwn = !route.params?.userId || route.params?.userId === user?.id;
  const targetId = isOwn ? (user?.id ?? '') : route.params.userId;

  const { data: profile, isLoading } = useProfile(targetId);
  const { data: posts } = useUserPosts(targetId);
  const { data: isFollowing } = useFollowStatus(targetId);
  const toggleFollow = useToggleFollow();
  const orCreate = useOrCreateConversation();

  const handleFollow = () => {
    if (!targetId) return;
    toggleFollow.mutate({ targetId, isFollowing: !!isFollowing });
  };

  const handleMessage = async () => {
    const convId = await orCreate.mutateAsync(targetId);
    nav.navigate('Chat', {
      conversationId: convId,
      otherUser: {
        id: profile!.id,
        username: profile!.username,
        display_name: profile!.display_name,
        avatar_url: profile!.avatar_url,
        is_verified: profile!.is_verified,
      },
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {!isOwn ? (
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerUsername}>@{profile.username}</Text>
        {isOwn ? (
          <TouchableOpacity style={styles.iconBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <View style={styles.profileSection}>
          <View style={styles.avatarRow}>
            <Avatar uri={profile.avatar_url} username={profile.username} size={80} isVerified={profile.is_verified} />
            <View style={styles.statsRow}>
              {[
                { label: 'Posts', value: profile.post_count },
                { label: 'Followers', value: profile.follower_count },
                { label: 'Following', value: profile.following_count },
              ].map((s) => (
                <View style={styles.stat} key={s.label}>
                  <Text style={styles.statValue}>{formatCount(s.value)}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{profile.display_name ?? profile.username}</Text>
              {profile.is_verified && (
                <View style={styles.verifiedTag}>
                  <Ionicons name="shield-checkmark" size={12} color={Colors.white} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>

          {!isOwn ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={handleFollow}
                disabled={toggleFollow.isPending}
                activeOpacity={0.8}
              >
                {toggleFollow.isPending ? (
                  <ActivityIndicator size="small" color={isFollowing ? Colors.textPrimary : Colors.white} />
                ) : (
                  <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.messageBtn} onPress={handleMessage} disabled={orCreate.isPending} activeOpacity={0.8}>
                <Ionicons name="paper-plane-outline" size={18} color={Colors.textPrimary} />
                <Text style={styles.messageBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <View style={styles.authenticitySeal}>
            <Ionicons name="camera" size={13} color={Colors.primary} />
            <Text style={styles.sealText}>All posts captured live • No filters • No AI</Text>
          </View>
        </View>

        <View style={styles.gridDivider} />

        {!posts || posts.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyGridTitle}>No posts yet</Text>
            {isOwn && <Text style={styles.emptyGridSubtitle}>Take your first live photo</Text>}
          </View>
        ) : (
          <View style={styles.grid}>
            {posts.map((post) => (
              <TouchableOpacity key={post.id} style={styles.tile} activeOpacity={0.9}>
                <Image source={{ uri: post.media_url }} style={styles.tileImg} />
                {post.like_count > 0 && (
                  <View style={styles.tileLikes}>
                    <Ionicons name="heart" size={10} color={Colors.white} />
                    <Text style={styles.tileLikeCount}>{formatCount(post.like_count)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerUsername: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '800' },
  profileSection: { padding: Spacing.md, gap: Spacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  nameSection: { gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800' },
  verifiedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2,
  },
  verifiedText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  bio: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  actionButtons: { flexDirection: 'row', gap: Spacing.sm },
  followBtn: {
    flex: 1, backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  followingBtn: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  followBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '800' },
  followingBtnText: { color: Colors.textPrimary },
  messageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  messageBtnText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  editBtn: {
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  editBtnText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  authenticitySeal: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(79,70,229,0.08)',
    borderRadius: Radius.sm, padding: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  sealText: { color: Colors.textMuted, fontSize: 11, fontWeight: '500' },
  gridDivider: { height: 1, backgroundColor: Colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 1.5 },
  tile: { width: TILE, height: TILE, backgroundColor: Colors.surfaceAlt },
  tileImg: { width: '100%', height: '100%' },
  tileLikes: {
    position: 'absolute', bottom: 4, left: 4,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  tileLikeCount: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  emptyGrid: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  emptyGridTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  emptyGridSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm },
});
