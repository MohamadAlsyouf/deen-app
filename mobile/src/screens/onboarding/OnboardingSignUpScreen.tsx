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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Input } from '@/components';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { auth as firebaseAuth } from '@/config/firebase';
import { setPendingWelcome } from '@/utils/pendingWelcome';

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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const deferredPassword = useDeferredValue(password);

  const handleFirstNameChange = useCallback((text: string) => {
    setFirstName(text);
    setErrorMessage((p) => (p ? '' : p));
  }, []);

  const handleLastNameChange = useCallback((text: string) => {
    setLastName(text);
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
    if (!firstName.trim()) {
      setErrorMessage('Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      setErrorMessage('Please enter your last name.');
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
      const displayName = `${firstName.trim()} ${lastName.trim()}`;
      await signUp(email.trim(), password, displayName);

      const user = firebaseAuth.currentUser;
      if (user) {
        setPendingWelcome({ displayName, isNewUser: true });

        await authService.createUserDocument(user.uid, {
          email: email.trim(),
          displayName,
          userType,
          focusFeatures,
          notificationsEnabled,
        });
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
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.middle]}
        style={[styles.gradientHeader, { paddingTop: insets.top + spacing.md }]}
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
        <Text style={styles.headerTitle}>Create your account</Text>
        <Text style={styles.headerSubtitle}>Just a few details to get started</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Name Row - side by side */}
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>First Name</Text>
                  <Ionicons name="person-outline" size={15} color={colors.text.tertiary} />
                </View>
                <Input
                  value={firstName}
                  onChangeText={handleFirstNameChange}
                  placeholder="First name"
                  autoCapitalize="words"
                  autoComplete="name-given"
                  containerStyle={styles.inputNoMargin}
                />
              </View>
              <View style={styles.nameField}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Last Name</Text>
                  <Ionicons name="people-outline" size={15} color={colors.text.tertiary} />
                </View>
                <Input
                  value={lastName}
                  onChangeText={handleLastNameChange}
                  placeholder="Last name"
                  autoCapitalize="words"
                  autoComplete="name-family"
                  containerStyle={styles.inputNoMargin}
                />
              </View>
            </View>

          {/* Email Input */}
          <View>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Ionicons name="mail-outline" size={15} color={colors.text.tertiary} />
            </View>
            <Input
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              containerStyle={styles.inputNoMargin}
            />
          </View>

          {/* Password Input */}
          <View>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <Ionicons name="lock-closed-outline" size={15} color={colors.text.tertiary} />
            </View>
            <Input
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Create a password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              containerStyle={styles.inputNoMargin}
            />
          </View>

          {/* Confirm Password Input */}
          <View>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <Ionicons name="lock-closed-outline" size={15} color={colors.text.tertiary} />
            </View>
            <Input
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              placeholder="Confirm your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              containerStyle={styles.inputNoMargin}
            />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientHeader: {
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
  keyboardView: {
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
    gap: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 20,
  },
  inputNoMargin: {
    marginBottom: 0,
  },
  passwordRequirements: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
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
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: spacing.lg,
    ...shadows.small,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.white,
    lineHeight: 22,
  },
});
