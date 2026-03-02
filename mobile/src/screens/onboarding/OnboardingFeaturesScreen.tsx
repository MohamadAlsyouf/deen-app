import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { FeatureKey } from '@/types/user';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

type NavigationProp = StackNavigationProp<RootStackParamList, 'OnboardingFeatures'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'OnboardingFeatures'>;

interface Feature {
  key: FeatureKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    key: 'quran',
    icon: 'book-outline',
    title: 'Quran',
    description: 'Browse chapters & listen to recitations',
  },
  {
    key: 'prayer',
    icon: 'hand-left-outline',
    title: 'Prayer Guide',
    description: 'Step-by-step daily prayer instructions',
  },
  {
    key: 'pillars',
    icon: 'compass-outline',
    title: 'Pillars of Islam',
    description: 'The 5 Pillars of Islam & 6 of Iman',
  },
  {
    key: 'names',
    icon: 'star-outline',
    title: '99 Names of Allah',
    description: 'Learn & memorize the beautiful names',
  },
  {
    key: 'dua',
    icon: 'heart-outline',
    title: 'Dua & Dhikr',
    description: 'Daily supplications & remembrance',
  },
  {
    key: 'sunnah',
    icon: 'sunny-outline',
    title: 'Sunnah',
    description: 'Prophetic practices for daily life',
  },
];

interface FeatureCardProps {
  feature: Feature;
  selected: boolean;
  onToggle: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, selected, onToggle }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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
      onPress={onToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.featureCard,
          selected && styles.featureCardSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {selected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={14} color={colors.text.white} />
          </View>
        )}
        <View style={[styles.featureIcon, selected && styles.featureIconSelected]}>
          <Ionicons
            name={feature.icon}
            size={28}
            color={selected ? colors.primary : colors.text.secondary}
          />
        </View>
        <Text style={[styles.featureTitle, selected && styles.featureTitleSelected]}>
          {feature.title}
        </Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </Animated.View>
    </Pressable>
  );
};

export const OnboardingFeaturesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { userType } = route.params;

  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([]);
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const toggleFeature = (key: FeatureKey) => {
    setSelectedFeatures((prev) => {
      const newSelection = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];

      // Animate button opacity
      Animated.timing(buttonOpacity, {
        toValue: newSelection.length > 0 ? 1 : 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();

      return newSelection;
    });
  };

  const handleContinue = () => {
    if (selectedFeatures.length > 0) {
      navigation.navigate('OnboardingSignUp', {
        userType,
        focusFeatures: selectedFeatures,
      });
    }
  };

  const isDisabled = selectedFeatures.length === 0;

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.middle]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.white} />
        </TouchableOpacity>
        <Text style={styles.title}>What interests you most?</Text>
        <Text style={styles.subtitle}>Select the features you'd like to focus on</Text>
        <Text style={styles.note}>You can always access everything from the menu</Text>
      </LinearGradient>

      {/* Features Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.key}
              feature={feature}
              selected={selectedFeatures.includes(feature.key)}
              onToggle={() => toggleFeature(feature.key)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue Button - only shown when features are selected */}
      {selectedFeatures.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Animated.View style={{ opacity: buttonOpacity }}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  note: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  featureCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.small,
  },
  featureCardSelected: {
    backgroundColor: colors.successLight,
    borderColor: colors.primary,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureIconSelected: {
    backgroundColor: 'rgba(27, 67, 50, 0.15)',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  featureTitleSelected: {
    color: colors.primary,
  },
  featureDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.backgroundAlt,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg - 2,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  continueButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.white,
    lineHeight: 22,
  },
});
