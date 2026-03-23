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
  titleAction?: {
    iconName: IoniconName;
    iconColor?: string;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({ title, titleNumberOfLines = 1, dark, leftAction, rightAction, titleAction }) => {
  const iconColor = dark ? colors.text.white : colors.primary;
  const textColor = dark ? colors.text.white : colors.text.primary;
  const labelColor = dark ? colors.text.white : colors.primary;

  return (
    <View style={[styles.header, dark && styles.headerDark]}>
      <View style={[styles.sideLeft, leftAction?.label && styles.sideLeftWide]}>
        {leftAction ? (
          <TouchableOpacity
            onPress={leftAction.onPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionButton}
          >
            {leftAction.iconName && (
              <Ionicons name={leftAction.iconName} size={22} color={iconColor} />
            )}
            {leftAction.label && (
              <Text style={[styles.actionText, { color: labelColor }, leftAction.iconName && styles.actionTextWithIcon]}>
                {leftAction.label}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.titleWrap}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: textColor }]}
            numberOfLines={titleNumberOfLines || undefined}
            ellipsizeMode={titleNumberOfLines ? "tail" : undefined}
          >
            {title}
          </Text>
          {titleAction && (
            <TouchableOpacity
              onPress={titleAction.onPress}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.titleActionButton}
            >
              <Ionicons
                name={titleAction.iconName}
                size={20}
                color={titleAction.iconColor || colors.text.tertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.sideRight, rightAction?.label && styles.sideRightWide]}>
        {rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionButton}
          >
            {rightAction.label && (
              <Text style={[styles.actionText, { color: labelColor }, rightAction.iconName && styles.actionTextWithIconRight]}>
                {rightAction.label}
              </Text>
            )}
            {rightAction.iconName && (
              <Ionicons name={rightAction.iconName} size={22} color={iconColor} />
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
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideLeftWide: {
    flex: 1,
  },
  sideRight: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sideRightWide: {
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleActionButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  actionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  actionTextWithIcon: {
    marginLeft: spacing.xs,
  },
  actionTextWithIconRight: {
    marginRight: spacing.xs,
  },
});
