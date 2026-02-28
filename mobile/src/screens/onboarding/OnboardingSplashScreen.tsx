import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, borderRadius } from '@/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const OnboardingSplashScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const getStartedTranslateY = useRef(new Animated.Value(40)).current;
  const signInTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Start the animation sequence
    const animationSequence = Animated.sequence([
      // 1. Logo fades in with scale
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]),
      // 2. Text fades in 300ms after logo
      Animated.delay(300),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3. Hold for 1 second
      Animated.delay(1000),
      // 4. Buttons fade in with staggered translateY (logo stays visible)
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.stagger(150, [
          Animated.spring(getStartedTranslateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(signInTranslateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    animationSequence.start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('OnboardingUserType');
  };

  const handleSignIn = () => {
    navigation.navigate('SignIn');
  };

  return (
    <LinearGradient
      colors={[colors.gradient.start, colors.gradient.middle]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Logo and Text Content - stays visible */}
      <View style={styles.logoSection}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Pillars Icon - Using grid as placeholder for 5 pillars */}
          <View style={styles.pillarsIcon}>
            <View style={styles.pillarsRow}>
              <View style={styles.pillar} />
              <View style={styles.pillar} />
              <View style={styles.pillar} />
              <View style={styles.pillar} />
              <View style={styles.pillar} />
            </View>
            <View style={styles.pillarsBase} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
            },
          ]}
        >
          <Text style={styles.appName}>Arkan</Text>
          <Text style={styles.arabicName}>أركان</Text>
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View
        style={[
          styles.buttonsContainer,
          {
            opacity: buttonsOpacity,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ translateY: getStartedTranslateY }],
          }}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY: signInTranslateY }],
          }}
        >
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.signInText}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarsIcon: {
    alignItems: 'center',
  },
  pillarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  pillar: {
    width: 12,
    height: 60,
    backgroundColor: colors.text.white,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  pillarsBase: {
    width: 100,
    height: 8,
    backgroundColor: colors.text.white,
    borderRadius: 4,
    marginTop: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.white,
    letterSpacing: 2,
  },
  arabicName: {
    fontSize: 24,
    color: colors.accent,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
  },
  getStartedButton: {
    backgroundColor: colors.text.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  signInButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  signInText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.white,
  },
});
