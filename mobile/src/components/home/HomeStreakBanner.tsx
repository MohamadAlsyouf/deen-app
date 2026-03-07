import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/theme';

type HomeStreakBannerProps = {
  visible: boolean;
  streakCount: number;
  topInset: number;
  onHide: () => void;
};

export const HomeStreakBanner: React.FC<HomeStreakBannerProps> = ({
  visible,
  streakCount,
  topInset,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const countScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    const show = Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);

    const pulseCount = Animated.sequence([
      Animated.timing(countScale, {
        toValue: 1.18,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(countScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);

    const hide = Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);

    const sequence = Animated.sequence([
      show,
      pulseCount,
      Animated.delay(2200),
      hide,
    ]);

    sequence.start(({ finished }) => {
      if (finished) {
        onHide();
      }
    });

    return () => {
      sequence.stop();
      translateY.setValue(-140);
      opacity.setValue(0);
      countScale.setValue(0.9);
    };
  }, [visible, translateY, opacity, countScale, onHide]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: topInset + spacing.sm,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.banner}>
        <View style={styles.iconWrap}>
          <Ionicons name="trophy" size={18} color={colors.accentLight} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Daily streak increased</Text>
          <Text style={styles.subtitle}>You have logged in for</Text>
        </View>
        <Animated.View style={[styles.countWrap, { transform: [{ scale: countScale }] }]}>
          <Text style={styles.countText}>{streakCount}</Text>
          <Text style={styles.countLabel}>days</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  countWrap: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.accentLight,
    lineHeight: 24,
  },
  countLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
