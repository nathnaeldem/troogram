import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useConversations } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { Colors, FontSize, Spacing, Radius } from '../theme/colors';
import { ConversationWithProfile } from '../types/database';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();

  const renderItem = ({ item }: { item: ConversationWithProfile }) => {
    const other = item.other_user;
    const timeAgo = item.last_message_at
      ? formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })
      : '';

    return (
      <TouchableOpacity
        style={styles.convoItem}
        onPress={() => nav.navigate('Chat', { conversationId: item.id, otherUser: other })}
        activeOpacity={0.7}
      >
        <Avatar uri={other?.avatar_url} username={other?.username} size={50} isVerified={other?.is_verified} />
        <View style={styles.convoInfo}>
          <View style={styles.convoTop}>
            <Text style={styles.convoName}>{other?.display_name ?? other?.username}</Text>
            <Text style={styles.convoTime}>{timeAgo}</Text>
          </View>
          <View style={styles.convoBottom}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message ?? 'Start a conversation'}
            </Text>
            {(item as any).unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{(item as any).unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.encryptBadge}>
          <Ionicons name="lock-closed" size={12} color={Colors.primary} />
          <Text style={styles.encryptText}>E2E Encrypted</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !conversations || conversations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>Find people to message from their profile</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.textPrimary },
  encryptBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(79,70,229,0.1)',
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  encryptText: { color: Colors.primary, fontSize: 11, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: FontSize.sm },
  convoItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  convoInfo: { flex: 1 },
  convoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convoName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  convoTime: { color: Colors.textMuted, fontSize: FontSize.xs },
  convoBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMessage: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
  unreadBadge: {
    backgroundColor: Colors.primary, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md + 50 + Spacing.sm },
});
