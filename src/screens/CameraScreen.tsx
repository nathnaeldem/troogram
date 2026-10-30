import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCreatePost } from '../hooks/usePosts';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { Colors, FontSize, Spacing, Radius } from '../theme/colors';

const { width, height } = Dimensions.get('window');

type Step = 'capture' | 'confirm';
type CaptureMode = 'photo' | 'video';

export default function CameraScreen() {
  const { user, session } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [step, setStep] = useState<Step>('capture');
  const [mode, setMode] = useState<CaptureMode>('photo');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const createPost = useCreatePost();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (photo?.uri) {
        setMediaUri(photo.uri);
        setStep('confirm');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not capture photo. Please try again.');
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) return;
    if (!micPermission?.granted) {
      const result = await requestMicPermission();
      if (!result.granted) {
        Alert.alert('Microphone Required', 'Enable microphone access to record videos.');
        return;
      }
    }
    setIsRecording(true);
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (video?.uri) {
        setMediaUri(video.uri);
        setStep('confirm');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not record video. Please try again.');
    } finally {
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const retake = () => {
    setMediaUri(null);
    setCaption('');
    setStep('capture');
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const uploadAndPost = async () => {
    if (!mediaUri || !user) return;
    setUploading(true);
    try {
      const isVideo = mode === 'video';
      const ext = isVideo ? 'mp4' : 'jpg';
      const contentType = isVideo ? 'video/mp4' : 'image/jpeg';
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      // In React Native, the easiest and most reliable way to upload to Supabase storage
      // without encountering base64 memory limit errors on large videos is using FormData.
      const formData = new FormData();
      formData.append('file', {
        uri: mediaUri,
        name: fileName,
        type: contentType,
      } as any);

      // We have to use the REST API directly since supabase-js upload() 
      // doesn't natively support RN FormData for large files well in all versions.
      // Use the current user's JWT for Authorization to satisfy storage RLS (role = authenticated)
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token ?? session?.access_token;
      if (!accessToken) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      const url = `${supabaseUrl}/storage/v1/object/posts/${fileName}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);

      await createPost.mutateAsync({
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: isVideo ? 'video' : 'photo',
        caption: caption.trim() || undefined,
      });

      setMediaUri(null);
      setCaption('');
      setStep('capture');
      Alert.alert('Posted!', `Your ${isVideo ? 'video' : 'photo'} is now live.`);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSubtitle}>
          Troogram requires camera access to capture live, authentic moments. No gallery uploads are allowed.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'confirm' && mediaUri) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <View style={[styles.confirmHeader, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity onPress={retake} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.confirmTitle}>New {mode === 'video' ? 'Video' : 'Post'}</Text>
              <View style={{ width: 40 }} />
            </View>

            {mode === 'video' ? (
              <Video
                source={{ uri: mediaUri }}
                style={styles.previewImage}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted={false}
              />
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
            )}

            <ScrollView
              style={styles.confirmFooter}
              contentContainerStyle={styles.confirmFooterContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.liveCaptureBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveCaptureTxt}>VERIFIED LIVE CAPTURE</Text>
                <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
              </View>

              <View style={styles.captionBox}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add a caption..."
                  placeholderTextColor={Colors.textMuted}
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                  maxLength={300}
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Text style={styles.charCount}>{caption.length}/300</Text>
              </View>

              <View style={styles.confirmActions}>
                <TouchableOpacity style={styles.discardBtn} onPress={retake} disabled={uploading}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  <Text style={styles.discardTxt}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postBtn} onPress={uploadAndPost} disabled={uploading} activeOpacity={0.85}>
                  {uploading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={18} color={Colors.white} />
                      <Text style={styles.postBtnTxt}>Share Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode={mode === 'video' ? 'video' : 'picture'}
      />

      <View style={[styles.topControls, { paddingTop: insets.top + 10 }]}>
        <View style={styles.noGalleryBadge}>
          <Ionicons name="images-outline" size={13} color={Colors.error} />
          <Text style={styles.noGalleryTxt}>NO GALLERY</Text>
        </View>
        <View style={styles.topRight}>
          {isRecording && (
            <View style={styles.recordingTimeBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recordingTimeText}>{formatDuration(recordingDuration)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.flashBtn}
            onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
          >
            <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.flipBtn}
          onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
        >
          <Ionicons name="camera-reverse-outline" size={26} color={Colors.white} />
        </TouchableOpacity>

        {mode === 'photo' ? (
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture} activeOpacity={0.8}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.captureBtn, isRecording && styles.captureBtnRecording]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            <View style={[styles.captureInner, isRecording && styles.captureInnerRecording]} />
          </TouchableOpacity>
        )}

        <View style={{ width: 52 }} />
      </View>

      {/* Mode toggle */}
      {!isRecording && (
        <View style={[styles.modeToggle, { bottom: insets.bottom + 100 }]}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'photo' && styles.modeBtnActive]}
            onPress={() => setMode('photo')}
          >
            <Ionicons name="camera" size={18} color={mode === 'photo' ? Colors.white : Colors.textMuted} />
            <Text style={[styles.modeTxt, mode === 'photo' && styles.modeTxtActive]}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'video' && styles.modeBtnActive]}
            onPress={() => setMode('video')}
          >
            <Ionicons name="videocam" size={18} color={mode === 'video' ? Colors.white : Colors.textMuted} />
            <Text style={[styles.modeTxt, mode === 'video' && styles.modeTxtActive]}>Video</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  permissionContainer: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.background },
  permTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  permSubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  permBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: 28 },
  permBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  topControls: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: Spacing.lg,
  },
  noGalleryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.5)',
  },
  noGalleryTxt: { color: Colors.error, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  flashBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 },
  bottomControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', paddingHorizontal: Spacing.xl,
  },
  flipBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 26 },
  captureBtn: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.white },
  confirmHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800' },
  previewImage: { width, height: width * 0.56, backgroundColor: Colors.surfaceAlt },
  confirmFooter: { flex: 1, backgroundColor: Colors.background },
  confirmFooterContent: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },
  liveCaptureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(79,70,229,0.1)',
    borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border, alignSelf: 'flex-start',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.orange },
  liveCaptureTxt: { color: Colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  captionBox: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  captionInput: { color: Colors.textPrimary, fontSize: FontSize.md, minHeight: 60, maxHeight: 100 },
  charCount: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'right', marginTop: 4 },
  confirmActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  discardBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.surface, borderRadius: Radius.md, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  discardTxt: { color: Colors.error, fontSize: FontSize.md, fontWeight: '700' },
  postBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14,
  },
  postBtnTxt: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recordingTimeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.8)',
    borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white },
  recordingTimeText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '800', fontVariant: ['tabular-nums'] },
  captureBtnRecording: { borderColor: Colors.error },
  captureInnerRecording: { width: 28, height: 28, borderRadius: 6, backgroundColor: Colors.error },
  modeToggle: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modeBtnActive: { backgroundColor: 'rgba(79,70,229,0.7)' },
  modeTxt: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '700' },
  modeTxtActive: { color: Colors.white },
});
