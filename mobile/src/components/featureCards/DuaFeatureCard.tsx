/**
 * DuaFeatureCard - Feature card for Dua/Supplication section
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';

interface DuaFeatureCardProps {
  onPress: () => void;
}

export const DuaFeatureCard: React.FC<DuaFeatureCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="hand-left" size={32} color="rgba(255,255,255,0.95)" />
        </View>
        <View style={styles.content}>
          <Text style={styles.arabicTitle}>الدعاء والذكر</Text>
          <Text style={styles.title}>Dua & Dhikr</Text>
          <Text style={styles.subtitle}>
            Morning, evening, and daily supplications with Arabic text and translations
          </Text>
        </View>
        <View style={styles.arrow}>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  arabicTitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontFamily: 'System',
  },
  title: {
    ...typography.h3,
    color: colors.text.white,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  arrow: {
    marginLeft: spacing.sm,
  },
});
