import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { UserType } from '@/types/user';

type NavigationProp = StackNavigationProp<RootStackParamList, 'OnboardingUserType'>;

interface UserTypeOption {
  type: UserType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const USER_TYPES: UserTypeOption[] = [
  {
    type: 'muslim',
    icon: 'moon-outline',
    title: "I'm a Muslim",
    description: 'Strengthen your foundation and deepen your practice',
  },
  {
    type: 'revert',
    icon: 'heart-outline',
    title: "I'm a recent Revert",
    description: "Welcome home — we'll guide you step by step",
  },
  {
    type: 'learner',
    icon: 'book-outline',
    title: "I'm here to learn",
    description: 'Explore Islam with curiosity and openness',
  },
];

interface UserTypeCardProps {
  option: UserTypeOption;
  onPress: () => void;
}

const UserTypeCard: React.FC<UserTypeCardProps> = ({ option, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.cardIcon}>
          <Ionicons name={option.icon} size={28} color={colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{option.title}</Text>
          <Text style={styles.cardDescription}>{option.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
      </Animated.View>
    </Pressable>
  );
};

export const OnboardingUserTypeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const handleSelectUserType = (userType: UserType) => {
    navigation.navigate('OnboardingFeatures', { userType });
  };

  return (
    <LinearGradient
      colors={[colors.gradient.start, colors.gradient.middle]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This helps us personalize your experience
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {USER_TYPES.map((option) => (
            <UserTypeCard
              key={option.type}
              option={option}
              onPress={() => handleSelectUserType(option.type)}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  cardsContainer: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
