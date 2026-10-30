import React, { useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, useMarkNotificationsRead } from '../hooks/useNotifications';
import Avatar from '../components/Avatar';
import { NotificationWithActor } from '../types/database';
import { Colors, FontSize, Spacing, Radius } from '../theme/colors';

function NotificationItem({ item }: { item: NotificationWithActor }) {
  const nav = useNavigation<any>();
  const actor = item.actor;
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  const handlePress = () => {
    if (item.type === 'like' && item.post_id) {
      nav.navigate('ProfileView', { userId: actor?.id });
    } else if (item.type === 'follow') {
      nav.navigate('ProfileView', { userId: actor?.id });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.item, !item.is_read && styles.itemUnread]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrapper}>
        <Avatar
          uri={actor?.avatar_url}
          username={actor?.username}
          size={44}
          isVerified={actor?.is_verified}
        />
        <View style={[styles.typeBadge, item.type === 'like' ? styles.likeBadge : styles.followBadge]}>
          <Ionicons
            name={item.type === 'like' ? 'heart' : 'person-add'}
            size={10}
            color={Colors.white}
          />
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.notifText} numberOfLines={2}>
          <Text style={styles.actorName}>{actor?.display_name ?? actor?.username}</Text>
          {item.type === 'like' ? ' liked your post' : ' started following you'}
        </Text>
        <Text style={styles.timeText}>{timeAgo}</Text>
      </View>

      {item.type === 'like' && item.post && (
        <Image
          source={{ uri: item.post.media_url }}
          style={styles.postThumb}
          resizeMode="cover"
        />
      )}

      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const { data: notifications, isLoading, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    const timer = setTimeout(() => {
      markRead.mutate();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const renderItem = useCallback(({ item }: { item: NotificationWithActor }) => (
    <NotificationItem item={item} />
  ), []);

  const keyExtractor = useCallback((item: NotificationWithActor) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !notifications || notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>When someone likes or follows you, you'll see it here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.xl },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  itemUnread: { backgroundColor: 'rgba(79,70,229,0.06)' },
  avatarWrapper: { position: 'relative' },
  typeBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  likeBadge: { backgroundColor: Colors.error },
  followBadge: { backgroundColor: Colors.primary },
  textBlock: { flex: 1 },
  notifText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 19 },
  actorName: { color: Colors.textPrimary, fontWeight: '700' },
  timeText: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 3 },
  postThumb: {
    width: 44, height: 44, borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
    alignSelf: 'center',
  },
});
