import React, { useState, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  Dimensions, Pressable,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { PostWithProfile } from '../types/database';
import { useToggleLike } from '../hooks/usePosts';
import Avatar from './Avatar';
import { Colors, FontSize, Spacing, Radius } from '../theme/colors';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: PostWithProfile;
  currentUserId?: string;
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const nav = useNavigation<any>();
  const toggleLike = useToggleLike();
  const [imgError, setImgError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<Video>(null);
  const profile = (post as any).profiles;
  const isVideo = post.media_type === 'video';

  const handleLike = () => {
    toggleLike.mutate({ postId: post.id, liked: !!post.liked_by_me });
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.userRow}
          onPress={() => nav.navigate('ProfileView', { userId: profile?.id })}
        >
          <Avatar
            uri={profile?.avatar_url}
            username={profile?.username}
            size={38}
            isVerified={profile?.is_verified}
          />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{profile?.display_name ?? profile?.username}</Text>
              {profile?.is_verified && (
                <Ionicons name="shield-checkmark" size={13} color={Colors.primary} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.handle}>@{profile?.username}</Text>
          </View>
        </Pressable>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE CAPTURE</Text>
        </View>
      </View>

      {isVideo ? (
        <Pressable style={styles.videoContainer} onPress={() => setIsPlaying(!isPlaying)}>
          <Video
            ref={videoRef}
            source={{ uri: post.media_url }}
            style={styles.image}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted={isMuted}
            shouldPlay={isPlaying}
          />
          {!isPlaying && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={32} color={Colors.white} />
              </View>
            </View>
          )}
          <TouchableOpacity
            style={styles.muteBtn}
            onPress={(e) => { e.stopPropagation; setIsMuted(!isMuted); }}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={16} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.videoTag}>
            <Ionicons name="videocam" size={11} color={Colors.white} />
            <Text style={styles.videoTagText}>VIDEO</Text>
          </View>
        </Pressable>
      ) : !imgError ? (
        <Image
          source={{ uri: post.media_url }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="camera-outline" size={40} color={Colors.textMuted} />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Ionicons
            name={post.liked_by_me ? 'heart' : 'heart-outline'}
            size={24}
            color={post.liked_by_me ? Colors.error : Colors.textSecondary}
          />
          <Text style={styles.actionCount}>{post.like_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={22} color={Colors.textSecondary} />
          <Text style={styles.actionCount}>{post.comment_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
        <Text style={styles.time}>{timeAgo}</Text>
      </View>

      {post.caption ? (
        <View style={styles.captionRow}>
          <Text style={styles.captionUsername}>{profile?.username} </Text>
          <Text style={styles.captionText}>{post.caption}</Text>
        </View>
      ) : null}

      {post.location ? (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.locationText}>{post.location}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userInfo: { marginLeft: Spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  username: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  handle: { color: Colors.textMuted, fontSize: FontSize.xs },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79,70,229,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.orange, marginRight: 4 },
  liveText: { color: Colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  image: { width, height: width, backgroundColor: Colors.surfaceAlt },
  imagePlaceholder: {
    width,
    height: width * 0.6,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: Spacing.md },
  actionCount: { color: Colors.textSecondary, fontSize: FontSize.sm, marginLeft: 5 },
  time: { color: Colors.textMuted, fontSize: FontSize.xs },
  captionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, paddingBottom: Spacing.xs },
  captionUsername: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  captionText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  locationText: { color: Colors.textMuted, fontSize: FontSize.xs, marginLeft: 3 },
  videoContainer: { position: 'relative' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    paddingLeft: 4,
  },
  muteBtn: {
    position: 'absolute', bottom: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  videoTag: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  videoTagText: { color: Colors.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
