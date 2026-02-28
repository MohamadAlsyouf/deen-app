import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Input } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAuth } from '@/hooks/useAuth';

type NavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    setErrorMessage((p) => (p ? '' : p));
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    setErrorMessage((p) => (p ? '' : p));
  }, []);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      // On successful sign in, navigate to welcome screen
      // Get the user's display name from the auth state
      const { auth } = await import('@/config/firebase');
      const user = auth.currentUser;

      // Small delay to allow auth state to propagate and navigator to switch stacks
      setTimeout(() => {
        navigation.navigate('Welcome', {
          displayName: user?.displayName || 'User',
          isNewUser: false,
        });
      }, 100);
    } catch (error: any) {
      const errorCode = error?.code || '';
      if (
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/invalid-email'
      ) {
        setErrorMessage('Invalid email or password. Please try again.');
      } else if (errorCode === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please try again later.');
      } else {
        setErrorMessage(error.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.middle]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <Text style={styles.headerSubtitle}>Sign in to continue your journey</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="mail-outline" size={20} color={colors.text.secondary} />
              </View>
              <View style={styles.inputWrapper}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.text.secondary} />
              </View>
              <View style={styles.inputWrapper}>
                <Input
                  label="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              </View>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={colors.text.white} />
              ) : (
                <Text style={styles.submitButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('OnboardingSplash')}
                disabled={loading}
              >
                <Text style={styles.signUpLink}>Create one</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  form: {
    gap: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputIcon: {
    width: 40,
    paddingTop: 36,
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    marginLeft: 40,
    gap: spacing.xs,
  },
  errorMessage: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg - 2,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginTop: spacing.lg,
    marginLeft: 40,
    ...shadows.small,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.white,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginLeft: 40,
  },
  signUpText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
