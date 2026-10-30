import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, ActivityIndicator, ViewToken,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { useVideoFeed } from '../hooks/usePosts';
import { useToggleLike } from '../hooks/usePosts';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { PostWithProfile } from '../types/database';
import { Colors, FontSize, Spacing, Radius } from '../theme/colors';

const { width, height } = Dimensions.get('window');

function VideoCard({
  post,
  isActive,
  currentUserId,
}: {
  post: PostWithProfile;
  isActive: boolean;
  currentUserId?: string;
}) {
  const nav = useNavigation<any>();
  const videoRef = useRef<Video>(null);
  const toggleLike = useToggleLike();
  const [isMuted, setIsMuted] = useState(false);
  const profile = (post as any).profiles;

  React.useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync();
    } else {
      videoRef.current.pauseAsync();
      videoRef.current.setPositionAsync(0);
    }
  }, [isActive]);

  const handleLike = () => {
    toggleLike.mutate({ postId: post.id, liked: !!post.liked_by_me });
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <View style={styles.videoCard}>
      <Video
        ref={videoRef}
        source={{ uri: post.media_url }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted={isMuted}
        shouldPlay={isActive}
      />

      {/* Overlay gradient */}
      <View style={styles.overlay} />

      {/* Right side actions (TikTok-style) */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => nav.navigate('ProfileView', { userId: profile?.id })}
        >
          <Avatar uri={profile?.avatar_url} username={profile?.username} size={44} isVerified={profile?.is_verified} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={handleLike}>
          <Ionicons
            name={post.liked_by_me ? 'heart' : 'heart-outline'}
            size={32}
            color={post.liked_by_me ? Colors.error : Colors.white}
          />
          <Text style={styles.sideCount}>{post.like_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn}>
          <Ionicons name="chatbubble-outline" size={28} color={Colors.white} />
          <Text style={styles.sideCount}>{post.comment_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn}>
          <Ionicons name="paper-plane-outline" size={28} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={() => setIsMuted(!isMuted)}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => nav.navigate('ProfileView', { userId: profile?.id })}
        >
          <Text style={styles.displayName}>
            {profile?.display_name ?? profile?.username}
          </Text>
          {profile?.is_verified && (
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
        {post.caption ? <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text> : null}
        <View style={styles.metaRow}>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE CAPTURE</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
      </View>
    </View>
  );
}

export default function VideoFeedScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: videos, isLoading, refetch, isRefetching } = useVideoFeed();
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderItem = useCallback(({ item, index }: { item: PostWithProfile; index: number }) => (
    <VideoCard post={item} isActive={index === activeIndex} currentUserId={user?.id} />
  ), [activeIndex, user?.id]);

  const keyExtractor = useCallback((item: PostWithProfile) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="videocam-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No videos yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to share a video moment</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
      />

      {/* Top header overlay */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 6 }]} pointerEvents="none">
        <Text style={styles.headerTitle}>Videos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  centerContainer: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: FontSize.sm },
  videoCard: {
    width,
    height,
    backgroundColor: Colors.black,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Subtle gradient effect at bottom
    borderBottomWidth: 0,
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 160,
    alignItems: 'center',
    gap: 18,
  },
  sideBtn: { alignItems: 'center', gap: 3 },
  sideCount: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '700' },
  bottomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 70,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  displayName: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  caption: { color: Colors.white, fontSize: FontSize.sm, marginBottom: 8, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(79,70,229,0.4)',
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    gap: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.orange },
  liveText: { color: Colors.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  timeText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs },
  topHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    alignItems: 'center', paddingBottom: 10,
  },
  headerTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' },
});
