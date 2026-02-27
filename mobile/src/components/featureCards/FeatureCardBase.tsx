import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/common/Card';
import { colors, spacing, typography, borderRadius } from '@/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type FeatureCardBaseProps = {
  title: string;
  description: string;
  iconName: IoniconName;
  onPress: () => void;
  style?: ViewStyle;
  testID?: string;
};

export const FeatureCardBase: React.FC<FeatureCardBaseProps> = ({
  title,
  description,
  iconName,
  onPress,
  style,
  testID,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} testID={testID}>
      <Card style={[styles.card, style]}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name={iconName} size={22} color={colors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 2,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});


