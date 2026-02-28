import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';

type ScreenRouteProp = RouteProp<RootStackParamList, 'Welcome'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { displayName, isNewUser } = route.params;

  // Extract first name
  const firstName = displayName?.split(' ')[0] || 'User';

  // Animation values
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation sequence
    const animationSequence = Animated.sequence([
      // 1. Icon fades in with scale
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]),
      // 2. Welcome text fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3. Subtitle fades in
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 4. Hold for 2 seconds
      Animated.delay(2000),
      // 5. Fade out the entire screen
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      // After animation completes, navigate to Main and reset the stack
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    });
  }, [navigation]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.middle]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Animated Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: iconOpacity,
                transform: [{ scale: iconScale }],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={60} color={colors.primary} />
            </View>
          </Animated.View>

          {/* Welcome Text */}
          <Animated.Text style={[styles.welcomeText, { opacity: textOpacity }]}>
            {isNewUser ? `Welcome to Arkan, ${firstName}!` : `Welcome back, ${firstName}!`}
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
            {isNewUser ? 'Your journey begins now' : 'Continue your journey'}
          </Animated.Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
