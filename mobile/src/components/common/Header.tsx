import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface HeaderProps {
  title: string;
  titleNumberOfLines?: number;
  dark?: boolean;
  leftAction?: {
    iconName?: IoniconName;
    label?: string;
    onPress: () => void;
  };
  rightAction?: {
    iconName?: IoniconName;
    label?: string;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({ title, titleNumberOfLines = 1, dark, leftAction, rightAction }) => {
  const iconColor = dark ? colors.text.white : colors.primary;
  const textColor = dark ? colors.text.white : colors.text.primary;
  const labelColor = dark ? colors.text.white : colors.primary;

  return (
    <View style={[styles.header, dark && styles.headerDark]}>
      <View style={styles.sideLeft}>
        {leftAction ? (
          <TouchableOpacity
            onPress={leftAction.onPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {leftAction.iconName ? (
              <Ionicons name={leftAction.iconName} size={22} color={iconColor} />
            ) : (
              <Text style={[styles.actionText, { color: labelColor }]}>{leftAction.label}</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.titleWrap}>
        <Text 
          style={[styles.title, { color: textColor }]} 
          numberOfLines={titleNumberOfLines || undefined}
          ellipsizeMode={titleNumberOfLines ? "tail" : undefined}
        >
          {title}
        </Text>
      </View>

      <View style={styles.sideRight}>
        {rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {rightAction.iconName ? (
              <Ionicons name={rightAction.iconName} size={22} color={iconColor} />
            ) : (
              <Text style={[styles.actionText, { color: labelColor }]}>{rightAction.label}</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerDark: {
    backgroundColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sideLeft: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  actionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

