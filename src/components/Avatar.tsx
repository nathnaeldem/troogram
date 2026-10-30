import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../theme/colors';

interface AvatarProps {
  uri?: string | null;
  username?: string | null;
  size?: number;
  isVerified?: boolean;
  style?: ViewStyle;
}

export default function Avatar({ uri, username, size = 40, isVerified = false, style }: AvatarProps) {
  const initials = (username ?? '?').charAt(0).toUpperCase();
  return (
    <View style={[styles.wrapper, style]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
      )}
      {isVerified && (
        <View style={[styles.badge, { width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16, right: -2, bottom: -2 }]}>
          <Ionicons name="checkmark" size={size * 0.18} color={Colors.white} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  image: { borderWidth: 2, borderColor: Colors.primary },
  placeholder: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: Colors.textSecondary, fontWeight: '700' },
  badge: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
});
