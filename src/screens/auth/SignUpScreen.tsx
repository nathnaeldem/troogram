import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../lib/supabase';
import GradientBackground from '../../components/GradientBackground';
import { Colors, FontSize, Spacing, Radius } from '../../theme/colors';

export default function SignUpScreen() {
  const nav = useNavigation<any>();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!username || !email || !password || !displayName) {
      Alert.alert('Missing fields', 'Please fill in all fields.'); return false;
    }
    if (username.length < 3) {
      Alert.alert('Invalid username', 'Username must be at least 3 characters.'); return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email.'); return false;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.'); return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: displayName } },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Sign up failed', error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await (supabase as any).from('profiles').upsert(
        {
          id: data.user.id,
          username: username.toLowerCase().trim(),
          display_name: displayName.trim(),
          is_verified: false,
          follower_count: 0,
          following_count: 0,
          post_count: 0,
        },
        { onConflict: 'id' }
      );

      if (profileError) {
        console.warn('Client profile upsert note:', profileError.message);
        // The DB trigger handles automatic profile creation as SECURITY DEFINER if RLS or unauthenticated session blocks client insert
      }

      await SecureStore.setItemAsync('troogram_email', email);
      await SecureStore.setItemAsync('troogram_password', password);
    }

    setLoading(false);
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join Troogram</Text>
            <Text style={styles.subtitle}>Share real moments. No filters. No fakes.</Text>
          </View>

          <View style={styles.form}>
            {FIELDS.map((f) => (
              <View style={styles.field} key={f.key}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name={f.icon as any} size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={f.key === 'username' ? username : f.key === 'displayName' ? displayName : f.key === 'email' ? email : password}
                    onChangeText={f.key === 'username' ? setUsername : f.key === 'displayName' ? setDisplayName : f.key === 'email' ? setEmail : setPassword}
                    keyboardType={f.key === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={f.key === 'email' || f.key === 'username' || f.key === 'password' ? 'none' : 'words'}
                    secureTextEntry={f.key === 'password' && !showPass}
                    autoComplete={f.key === 'email' ? 'email' : 'off'}
                  />
                  {f.key === 'password' && (
                    <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                      <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.realnessBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.realnessText}>
              By signing up, you agree that all content you post will be captured live through the camera. No uploads, no filters, no AI.
            </Text>
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnPrimaryText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => nav.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const FIELDS = [
  { key: 'displayName', label: 'Full Name', placeholder: 'Your real name', icon: 'person-outline' },
  { key: 'username', label: 'Username', placeholder: 'e.g. johndoe', icon: 'at-outline' },
  { key: 'email', label: 'Email', placeholder: 'your@email.com', icon: 'mail-outline' },
  { key: 'password', label: 'Password', placeholder: '••••••••', icon: 'lock-closed-outline' },
];

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: Spacing.lg, paddingTop: 60 },
  back: { marginBottom: Spacing.lg },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  form: { gap: Spacing.md, marginBottom: Spacing.md },
  field: { gap: 6 },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  realnessBadge: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(79,70,229,0.1)',
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    gap: 8, marginBottom: Spacing.lg,
  },
  realnessText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: 15,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  btnPrimaryText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  footerLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});
