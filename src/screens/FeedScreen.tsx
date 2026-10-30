import React, { useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, ActivityIndicator, TouchableOpacity,
  TextInput, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFeed, useSearchPosts } from '../hooks/usePosts';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { Colors, FontSize, Spacing, Radius } from '../theme/colors';
import { PostWithProfile } from '../types/database';

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, delay]);

  return debounced;
}

export default function FeedScreen() {
  const { user } = useAuth();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { data: unreadCount } = useUnreadNotificationCount();
  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(searchText, 400);
  const isSearching = debouncedSearch.length >= 2;

  const { data: posts, isLoading, isError, refetch, isRefetching } = useFeed();
  const { data: searchResults, isLoading: searchLoading } = useSearchPosts(debouncedSearch);

  const displayPosts = isSearching ? searchResults : posts;

  const renderItem = useCallback(({ item }: { item: PostWithProfile }) => (
    <PostCard post={item} currentUserId={user?.id} />
  ), [user?.id]);

  const keyExtractor = useCallback((item: PostWithProfile) => item.id, []);

  const clearSearch = () => {
    setSearchText('');
    setIsSearchFocused(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Ionicons name="camera" size={22} color={Colors.primary} />
          <Text style={styles.brandName}>troogram</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.liveIndicator}>
            <View style={styles.livePulse} />
            <Text style={styles.liveLabel}>LIVE</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => nav.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textSecondary} />
            {!!unreadCount && unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* TikTok-style search bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={18} color={isSearchFocused ? Colors.primary : Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people, posts..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => { if (!searchText) setIsSearchFocused(false); }}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {isSearchFocused && searchText.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search loading state */}
      {isSearching && searchLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : isSearching && (!searchResults || searchResults.length === 0) ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySubtitle}>Try a different search term</Text>
        </View>
      ) : isLoading && !isSearching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading live feed...</Text>
        </View>
      ) : isError && !isSearching ? (
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>Could not load feed</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !displayPosts || displayPosts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to share a real moment</Text>
        </View>
      ) : (
        <FlatList
          data={displayPosts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          refreshControl={
            !isSearching ? (
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            ) : undefined
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          removeClippedSubviews
          maxToRenderPerBatch={5}
          windowSize={10}
          onScrollBeginDrag={Keyboard.dismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.white, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.4)',
    gap: 5,
  },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.orange },
  liveLabel: { color: Colors.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchBarFocused: { borderColor: Colors.primary },
  searchInput: {
    flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm, padding: 0,
  },
  cancelBtn: { paddingVertical: 6 },
  cancelText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 8 },
  errorText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  retryBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 8,
  },
  retryText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: FontSize.sm },
  bellBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: Colors.background,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
});
