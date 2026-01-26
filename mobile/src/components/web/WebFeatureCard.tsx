/**
 * Enhanced Feature Card for web with hover effects and animations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { webShadows, transitions, gradients } from '@/theme/web';
import { useWebHover } from '@/hooks/useWebHover';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface WebFeatureCardProps {
  title: string;
  description: string;
  iconName: IoniconName;
  onPress: () => void;
  gradient?: [string, string];
  accentColor?: string;
  badge?: string;
  size?: 'normal' | 'large';
  index?: number;
}

export const WebFeatureCard: React.FC<WebFeatureCardProps> = ({
  title,
  description,
  iconName,
  onPress,
  gradient,
  accentColor = colors.primary,
  badge,
  size = 'normal',
  index = 0,
}) => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = width >= 1024;

  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: webShadows.large,
    },
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const iconHover = useWebHover({
    hoverStyle: {
      transform: 'scale(1.15) rotate(5deg)',
    },
    transition: transitions.bounce,
  });

  const arrowHover = useWebHover({
    hoverStyle: {
      transform: 'translateX(4px)',
      opacity: 1,
    },
    transition: transitions.fast,
  });

  const cardGradient = gradient || [accentColor, accentColor];

  // Animation delay based on index
  const animationStyle = isWeb ? {
    animationName: 'fadeInUp',
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
    animationDelay: `${index * 0.1}s`,
    opacity: 0,
  } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      // @ts-ignore - web event handlers
      onMouseEnter={() => {
        hover.handlers.onMouseEnter();
        iconHover.handlers.onMouseEnter();
        arrowHover.handlers.onMouseEnter();
      }}
      onMouseLeave={() => {
        hover.handlers.onMouseLeave();
        iconHover.handlers.onMouseLeave();
        arrowHover.handlers.onMouseLeave();
      }}
      style={[
        styles.card,
        isWeb && styles.webCard,
        isWeb && hover.style,
        isDesktop && size === 'large' && styles.cardLarge,
        // @ts-ignore
        animationStyle,
      ]}
    >
      {/* Gradient accent bar */}
      <LinearGradient
        colors={cardGradient as [string, string, ...string[]]}
        style={styles.accentBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      {/* Badge */}
      {badge && (
        <View style={[styles.badge, { backgroundColor: accentColor }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${accentColor}15` },
            isWeb && iconHover.style,
          ]}
        >
          <Ionicons name={iconName} size={28} color={accentColor} />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>

        {/* Arrow */}
        <View style={[styles.arrowContainer, isWeb && arrowHover.style]}>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={accentColor}
          />
        </View>
      </View>

      {/* Hover gradient overlay */}
      {isWeb && hover.isHovered && (
        <View style={[styles.hoverOverlay, { backgroundColor: `${accentColor}05` }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  webCard: {
    // @ts-ignore
    boxShadow: webShadows.small,
    cursor: 'pointer',
  },
  cardLarge: {
    marginBottom: spacing.lg,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  badge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.white,
    fontWeight: '600',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    // @ts-ignore
    transition: transitions.bounce,
  },
  textContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4,
    fontWeight: '700',
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    // @ts-ignore
    transition: transitions.fast,
  },
  hoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});
