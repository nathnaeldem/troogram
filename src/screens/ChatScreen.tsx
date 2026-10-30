import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMessages, useSendMessage } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { Colors, FontSize, Spacing, Radius } from '../theme/colors';
import { Message } from '../types/database';

type ChatRouteParams = {
  Chat: {
    conversationId: string;
    otherUser: { id: string; username: string; display_name: string | null; avatar_url: string | null; is_verified: boolean };
  };
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
  const { conversationId, otherUser } = route.params;
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);
  const [text, setText] = useState('');

  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await sendMessage.mutateAsync({ conversationId, content: trimmed });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const prevMsg = index > 0 ? messages![index - 1] : null;
    const showTime =
      !prevMsg ||
      new Date(item.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;

    return (
      <View>
        {showTime && (
          <Text style={styles.timeLabel}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
          {!isMe && (
            <Avatar uri={otherUser.avatar_url} username={otherUser.username} size={28} style={{ marginRight: 6, alignSelf: 'flex-end' }} />
          )}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Avatar uri={otherUser.avatar_url} username={otherUser.username} size={36} isVerified={otherUser.is_verified} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser.display_name ?? otherUser.username}</Text>
          <Text style={styles.headerHandle}>@{otherUser.username}</Text>
        </View>
        <View style={styles.encryptIcon}>
          <Ionicons name="lock-closed" size={14} color={Colors.primary} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages ?? []}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="lock-closed-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyChatText}>Messages are end-to-end encrypted</Text>
            </View>
          }
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          activeOpacity={0.8}
        >
          {sendMessage.isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="paper-plane" size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: { marginRight: 4 },
  headerInfo: { flex: 1 },
  headerName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  headerHandle: { color: Colors.textMuted, fontSize: FontSize.xs },
  encryptIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(79,70,229,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesList: { flexGrow: 1, padding: Spacing.md, gap: 4 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
  emptyChatText: { color: Colors.textMuted, fontSize: FontSize.sm },
  timeLabel: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', marginVertical: 8 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2 },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%', borderRadius: Radius.lg,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: FontSize.md, lineHeight: 20 },
  bubbleTextMe: { color: Colors.white },
  bubbleTextThem: { color: Colors.textPrimary },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  inputWrap: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 8, minHeight: 44,
    justifyContent: 'center',
  },
  input: { color: Colors.textPrimary, fontSize: FontSize.md, maxHeight: 100 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.surfaceAlt },
});
