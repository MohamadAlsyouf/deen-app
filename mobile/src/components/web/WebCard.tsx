/**
 * Enhanced Card component for web with hover effects
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, borderRadius } from '@/theme';
import { webShadows, transitions, gradients } from '@/theme/web';
import { useWebHover } from '@/hooks/useWebHover';

type CardVariant = 'default' | 'elevated' | 'glass' | 'gradient' | 'outlined';

interface WebCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  onPress?: () => void;
  disabled?: boolean;
  noPadding?: boolean;
  hoverEffect?: boolean;
}

export const WebCard: React.FC<WebCardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
  disabled = false,
  noPadding = false,
  hoverEffect = true,
}) => {
  const isWeb = Platform.OS === 'web';
  const isInteractive = !!onPress && !disabled;

  const hover = useWebHover({
    hoverStyle: hoverEffect && isInteractive ? {
      transform: 'translateY(-6px) scale(1.005)',
      boxShadow: webShadows.large,
    } : {},
    transition: transitions.smooth,
  });

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.background,
          // @ts-ignore
          boxShadow: webShadows.medium,
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          // @ts-ignore
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
        };
      case 'gradient':
        return {
          // @ts-ignore
          background: gradients.card,
        };
      case 'outlined':
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.background,
          // @ts-ignore
          boxShadow: isWeb ? webShadows.small : undefined,
        };
    }
  };

  const cardStyle = [
    styles.card,
    getVariantStyle(),
    noPadding && styles.noPadding,
    isWeb && styles.webCard,
    isWeb && isInteractive && hover.style,
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
        // @ts-ignore - web event handlers
        onMouseEnter={hover.handlers.onMouseEnter}
        onMouseLeave={hover.handlers.onMouseLeave}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  webCard: {
    // @ts-ignore
    transition: transitions.smooth,
    cursor: 'default',
  },
  noPadding: {
    padding: 0,
  },
  disabled: {
    opacity: 0.6,
  },
});
