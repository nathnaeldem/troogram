import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function GradientBackground({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  blob1: {
    position: 'absolute', top: -100, left: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(79,70,229,0.12)',
  },
  blob2: {
    position: 'absolute', top: 200, right: -120,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  blob3: {
    position: 'absolute', bottom: -80, left: 50,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(249,115,22,0.07)',
  },
});
