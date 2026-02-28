import React, { useState, useCallback, useDeferredValue } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Input } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'OnboardingSignUp'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'OnboardingSignUp'>;

const PASSWORD_REQUIREMENTS_CONFIG: { label: string; test: (pwd: string) => boolean }[] = [
  { label: 'At least 6 characters', test: (pwd) => pwd.length >= 6 },
  { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'One number (0-9)', test: (pwd) => /[0-9]/.test(pwd) },
];

const PasswordRequirementsDisplay: React.FC<{ password: string }> = React.memo(({ password }) => (
  <View style={styles.passwordRequirements}>
    <Text style={styles.passwordRequirementsTitle}>Password Requirements:</Text>
    {PASSWORD_REQUIREMENTS_CONFIG.map(({ label, test }, index) => (
      <View key={index} style={styles.requirementItem}>
        <Ionicons
          name={test(password) ? 'checkmark-circle' : 'ellipse-outline'}
          size={16}
          color={test(password) ? colors.success : colors.text.secondary}
        />
        <Text
          style={[
            styles.requirementText,
            test(password) && styles.requirementTextMet,
          ]}
        >
          {label}
        </Text>
      </View>
    ))}
  </View>
));

export const OnboardingSignUpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const { userType, focusFeatures } = route.params;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const deferredPassword = useDeferredValue(password);

  const handleFullNameChange = useCallback((text: string) => {
    setFullName(text);
    setErrorMessage((p) => (p ? '' : p));
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    setErrorMessage((p) => (p ? '' : p));
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    setErrorMessage((p) => (p ? '' : p));
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
    setErrorMessage((p) => (p ? '' : p));
  }, []);

  const checkPasswordRequirements = (pwd: string) =>
    PASSWORD_REQUIREMENTS_CONFIG.every(({ test }) => test(pwd));

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }

    if (!checkPasswordRequirements(password)) {
      setErrorMessage('Password does not meet all requirements.');
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('Please confirm your password.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      // Create the account
      await signUp(email.trim(), password, fullName.trim());

      // Get the current user and create Firestore document
      const { auth } = await import('@/config/firebase');
      const user = auth.currentUser;

      if (user) {
        await authService.createUserDocument(user.uid, {
          email: email.trim(),
          displayName: fullName.trim(),
          userType,
          focusFeatures,
          notificationsEnabled,
        });

        // Small delay to allow auth state to propagate and navigator to switch stacks
        setTimeout(() => {
          navigation.navigate('Welcome', {
            displayName: fullName.trim(),
            isNewUser: true,
          });
        }, 100);
      }
    } catch (error: any) {
      const errorCode = error?.code || '';
      if (errorCode === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please sign in or use a different email.');
      } else if (errorCode === 'auth/invalid-email') {
        setErrorMessage('Invalid email address. Please check and try again.');
      } else if (errorCode === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please choose a stronger password.');
      } else {
        setErrorMessage(error.message || 'Account creation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Just a few details to get started</Text>
        </View>

        <View style={styles.form}>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.inputWrapper}>
              <Input
                label="Full Name"
                value={fullName}
                onChangeText={handleFullNameChange}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          </View>

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
                placeholder="Create a password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
              />
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.inputWrapper}>
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                placeholder="Confirm your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
              />
            </View>
          </View>

          {/* Password Requirements */}
          {deferredPassword.length > 0 && (
            <PasswordRequirementsDisplay password={deferredPassword} />
          )}

          {/* Notifications Toggle */}
          <View style={styles.notificationRow}>
            <View style={styles.notificationLeft}>
              <View style={styles.notificationIcon}>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.notificationText}>
                Enable prayer reminders & notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notificationsEnabled ? colors.primary : colors.text.disabled}
            />
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
              <Text style={styles.submitButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
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
  passwordRequirements: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    marginLeft: 40,
  },
  passwordRequirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  requirementText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  requirementTextMet: {
    color: colors.success,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginLeft: 40,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  notificationIcon: {
    marginRight: spacing.sm,
  },
  notificationText: {
    fontSize: 14,
    color: colors.text.primary,
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
});
