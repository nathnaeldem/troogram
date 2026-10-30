import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import { Colors, FontSize, Spacing, Radius } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const nav = useNavigation<any>();

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logoRing}>
          <View style={styles.logoInner}>
            <Ionicons name="camera" size={44} color={Colors.white} />
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={10} color={Colors.white} />
            </View>
          </View>
        </View>
        <Text style={styles.brand}>troogram</Text>
        <Text style={styles.tagline}>No Filters. No Fakes. No AI.</Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View style={styles.featureRow} key={f.label}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => nav.navigate('SignUp')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => nav.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnSecondaryText}>Sign In</Text>
        </TouchableOpacity>
        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </GradientBackground>
  );
}

const FEATURES = [
  { icon: 'camera', label: 'Camera-only capture', desc: 'Every post is taken live — no gallery uploads.' },
  { icon: 'eye-off', label: 'No filters or edits', desc: 'What you see is real. Always.' },
  { icon: 'finger-print', label: 'Face ID login', desc: 'Secure biometric authentication.' },
  { icon: 'shield-checkmark', label: 'AI content moderation', desc: 'Anti-deepfake and anti-AI detection.' },
];

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 50 },
  logoSection: { alignItems: 'center' },
  logoRing: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(79,70,229,0.08)',
  },
  logoInner: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  checkBadge: {
    position: 'absolute', bottom: -4, right: -10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  brand: { fontSize: 36, fontWeight: '900', color: Colors.white, letterSpacing: -1 },
  tagline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase' },
  features: { gap: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  featureIcon: {
    width: 38, height: 38, borderRadius: Radius.sm,
    backgroundColor: 'rgba(79,70,229,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
    marginTop: 2,
  },
  featureLabel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  featureDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  actions: { gap: Spacing.sm },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  btnSecondary: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  btnSecondaryText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  legal: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
