import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';

export type ViewMode = 'all' | 'arabic' | 'english';

type ViewModeToggleProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  const modes: { key: ViewMode; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'arabic', label: 'عربي' },
    { key: 'english', label: 'English' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toggleBar}>
        {modes.map((mode) => {
          const isActive = viewMode === mode.key;
          return (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.toggleButton,
                isActive && styles.toggleButtonActive,
              ]}
              onPress={() => onViewModeChange(mode.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  isActive && styles.toggleTextActive,
                  mode.key === 'arabic' && styles.arabicText,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.text.white,
  },
  arabicText: {
    fontSize: 16,
  },
});
