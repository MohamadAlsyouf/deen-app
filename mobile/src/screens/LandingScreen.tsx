import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@/components';
import { colors, spacing, typography } from '@/theme';
import { useAuth } from '@/hooks/useAuth';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

export const LandingScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn, signUp } = useAuth();

  // Password validation functions
  const checkPasswordRequirements = (pwd: string): PasswordRequirement[] => {
    return [
      {
        label: 'At least 6 characters',
        met: pwd.length >= 6,
      },
      {
        label: 'One uppercase letter',
        met: /[A-Z]/.test(pwd),
      },
      {
        label: 'One lowercase letter',
        met: /[a-z]/.test(pwd),
      },
      {
        label: 'One number (0-9)',
        met: /[0-9]/.test(pwd),
      },
    ];
  };

  const passwordRequirements = isSignUp ? checkPasswordRequirements(password) : [];

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp) {
      // Validate all password requirements for sign up
      const requirements = checkPasswordRequirements(password);
      const unmetRequirements = requirements.filter((req) => !req.met);
      
      if (unmetRequirements.length > 0) {
        setErrorMessage('Password does not meet all requirements.');
        return;
      }

      if (!confirmPassword) {
        Alert.alert('Error', 'Please confirm your password.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setErrorMessage('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      // Handle invalid credentials and other auth errors
      const errorCode = error?.code || '';
      if (
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/invalid-email'
      ) {
        setErrorMessage('Invalid email or password. Please try again.');
      } else {
        setErrorMessage(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradient.start, colors.gradient.end]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={Platform.OS === 'web' && styles.webScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Deen Learning</Text>
            <Text style={styles.subtitle}>
              Your comprehensive platform to learn and deepen your understanding of Deen
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />

            {isSignUp && (
              <>
                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  placeholder="Confirm your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
              
                />

                {password.length > 0 && (
                  <View style={styles.passwordRequirements}>
                    <Text style={styles.passwordRequirementsTitle}>
                      Password Requirements:
                    </Text>
                    {passwordRequirements.map((requirement, index) => (
                      <View key={index} style={styles.requirementItem}>
                        <Text
                          style={[
                            styles.requirementCheck,
                            requirement.met && styles.requirementCheckMet,
                          ]}
                        >
                          {requirement.met ? '✓' : '○'}
                        </Text>
                        <Text
                          style={[
                            styles.requirementText,
                            requirement.met && styles.requirementTextMet,
                          ]}
                        >
                          {requirement.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {errorMessage ? (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}

            <Button
              title={isSignUp ? 'Sign Up' : 'Sign In'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.primaryButton}
            />

            <Button
              title={isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              onPress={toggleMode}
              variant="outline"
              disabled={loading}
            />
          </View>

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>Why Choose Deen Learning?</Text>
            <Text style={styles.featureText}>📚 Comprehensive Islamic knowledge</Text>
            <Text style={styles.featureText}>🎯 Easy to understand lessons</Text>
            <Text style={styles.featureText}>💬 Connect with our community</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  webScrollView: {
    // @ts-ignore - web-specific CSS properties
    overflowY: 'auto',
    // @ts-ignore - web-specific CSS properties
    WebkitOverflowScrolling: 'touch',
    // @ts-ignore - web-specific CSS properties
    touchAction: 'pan-y',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  form: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  errorMessage: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  passwordRequirements: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  passwordRequirementsTitle: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  requirementCheck: {
    ...typography.body,
    color: colors.text.secondary,
    marginRight: spacing.xs,
    fontSize: 16,
    width: 20,
  },
  requirementCheckMet: {
    color: colors.success,
    fontWeight: 'bold',
  },
  requirementText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  requirementTextMet: {
    color: colors.success,
    fontWeight: '500',
  },
  features: {
    alignItems: 'center',
  },
  featuresTitle: {
    ...typography.h3,
    color: colors.text.white,
    marginBottom: spacing.md,
  },
  featureText: {
    ...typography.bodyLarge,
    color: colors.text.white,
    marginBottom: spacing.sm,
  },
});

