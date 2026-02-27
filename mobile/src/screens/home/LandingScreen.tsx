import React, { useState, useCallback, useDeferredValue } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components';
import { colors, spacing, typography } from '@/theme';
import { useAuth } from '@/hooks/useAuth';

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <View style={styles.featureCard}>
    <View style={styles.featureIconContainer}>
      <Ionicons name={icon} size={28} color={colors.primary} />
    </View>
    <Text style={styles.featureCardTitle}>{title}</Text>
    <Text style={styles.featureCardDescription}>{description}</Text>
  </View>
);

interface AuthFormContentProps {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  isDesktop: boolean;
}

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

const AuthFormContent: React.FC<AuthFormContentProps> = React.memo(({ signIn, signUp, isDesktop }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSubmit = async () => {
    if (isSignUp && (!firstName.trim() || !lastName.trim())) {
      setErrorMessage('Please enter your first and last name.');
      return;
    }

    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (isSignUp) {
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
    }

    setErrorMessage('');
    setLoading(true);
    try {
      if (isSignUp) {
        const displayName = `${firstName.trim()} ${lastName.trim()}`;
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      const errorCode = error?.code || '';
      if (
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/invalid-email'
      ) {
        setErrorMessage('Invalid email or password. Please try again.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please sign in or use a different email.');
      } else {
        setErrorMessage(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  };

  return (
    <View style={[styles.authCard, isDesktop && styles.authCardDesktop]}>
      <Text style={styles.authTitle}>
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </Text>
      <Text style={styles.authSubtitle}>
        {isSignUp
          ? 'Start your learning journey today'
          : 'Sign in to continue learning'}
      </Text>

      {isSignUp && (
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={handleFirstNameChange}
              placeholder="First name"
              autoCapitalize="words"
              autoComplete="given-name"
            />
          </View>
          <View style={styles.nameField}>
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={handleLastNameChange}
              placeholder="Last name"
              autoCapitalize="words"
              autoComplete="family-name"
            />
          </View>
        </View>
      )}

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

          {deferredPassword.length > 0 && (
            <PasswordRequirementsDisplay password={deferredPassword} />
          )}
        </>
      )}

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      ) : null}

      <Button
        title={isSignUp ? 'Create Account' : 'Sign In'}
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
        </Text>
        <TouchableOpacity onPress={toggleMode} disabled={loading}>
          <Text style={styles.toggleLink}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const FEATURES = [
  {
    icon: 'book-outline' as const,
    title: 'Quran Recitation',
    description: 'Listen to beautiful recitations from renowned Qaris with verse-by-verse highlighting',
  },
  {
    icon: 'school-outline' as const,
    title: 'Learn the Pillars',
    description: 'Understand the 5 Pillars of Islam and 6 Pillars of Iman with detailed explanations',
  },
  {
    icon: 'heart-outline' as const,
    title: '99 Names of Allah',
    description: 'Explore and memorize the beautiful names of Allah with meanings and audio',
  },
  {
    icon: 'globe-outline' as const,
    title: 'Accessible Anywhere',
    description: 'Access your learning on iOS, Android, and web - your progress syncs everywhere',
  },
];

export const LandingScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768;
  const isDesktop = width >= 1024;
  const { signIn, signUp } = useAuth();

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.scrollView, isWeb && styles.webScrollView]}
        contentContainerStyle={[
          styles.scrollContent,
          isLargeScreen && styles.scrollContentLarge,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
          style={[styles.heroSection, isDesktop && styles.heroSectionDesktop]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
            {/* Left side - Branding & Features */}
            <View style={[styles.heroLeft, isDesktop && styles.heroLeftDesktop]}>
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Ionicons name="moon-outline" size={isDesktop ? 40 : 32} color={colors.accent} />
                </View>
                <Text style={[styles.logoText, isDesktop && styles.logoTextDesktop]}>
                  Deen Learning
                </Text>
              </View>

              <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
                Begin Your Journey{'\n'}of Islamic Knowledge
              </Text>

              <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
                A comprehensive platform to learn and deepen your understanding of Islam.
                Read the Quran, learn the pillars of faith, and grow spiritually.
              </Text>

              {isDesktop && (
                <View style={styles.heroStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>114</Text>
                    <Text style={styles.statLabel}>Surahs</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>99</Text>
                    <Text style={styles.statLabel}>Names of Allah</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>11</Text>
                    <Text style={styles.statLabel}>Pillars</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Right side - Auth Form */}
            <View style={[styles.heroRight, isDesktop && styles.heroRightDesktop]}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.authContainer}
              >
                <AuthFormContent signIn={signIn} signUp={signUp} isDesktop={isDesktop} />
              </KeyboardAvoidingView>
            </View>
          </View>
        </LinearGradient>

        {/* Features Section */}
        <View style={[styles.featuresSection, isDesktop && styles.featuresSectionDesktop]}>
          <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
            Everything You Need to Learn
          </Text>
          <Text style={styles.sectionSubtitle}>
            Comprehensive tools and resources for your Islamic education journey
          </Text>

          <View style={[styles.featuresGrid, isDesktop && styles.featuresGridDesktop]}>
            {FEATURES.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerBrand}>
              <Ionicons name="moon-outline" size={24} color={colors.text.white} />
              <Text style={styles.footerBrandText}>Deen Learning</Text>
            </View>
            <Text style={styles.footerText}>
              Empowering Muslims worldwide to learn and grow in their faith
            </Text>
            <Text style={styles.copyright}>
              {new Date().getFullYear()} Deen Learning. Made with love for the Ummah.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  webScrollView: {
    // @ts-ignore - web-specific
    overflowY: 'auto',
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentLarge: {
    // No extra styles needed
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
    minHeight: 600,
  },
  heroSectionDesktop: {
    paddingHorizontal: spacing.xxl * 2,
    paddingTop: spacing.xxl * 3,
    paddingBottom: spacing.xxl * 2,
    minHeight: 700,
  },
  heroContent: {
    flex: 1,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  heroContentDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    marginBottom: spacing.xl,
  },
  heroLeftDesktop: {
    flex: 1,
    marginBottom: 0,
    paddingRight: spacing.xxl * 2,
  },
  heroRight: {
    width: '100%',
  },
  heroRightDesktop: {
    width: 420,
    flexShrink: 0,
  },

  // Logo
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.white,
  },
  logoTextDesktop: {
    fontSize: 28,
  },

  // Hero Text
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.white,
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  heroTitleDesktop: {
    fontSize: 48,
    lineHeight: 58,
    marginBottom: spacing.lg,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  heroSubtitleDesktop: {
    fontSize: 18,
    lineHeight: 30,
    maxWidth: 500,
  },

  // Hero Stats
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Auth Card
  authContainer: {
    width: '100%',
  },
  authCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
      },
    }),
  },
  authCardDesktop: {
    padding: spacing.xl,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  toggleText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },

  // Password Requirements
  passwordRequirements: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
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

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorMessage: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },

  // Features Section
  featuresSection: {
    padding: spacing.xl,
    backgroundColor: colors.backgroundAlt,
  },
  featuresSectionDesktop: {
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xxl * 2,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitleDesktop: {
    fontSize: 36,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 600,
    alignSelf: 'center',
  },
  featuresGrid: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  featuresGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  featureCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        width: 280,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featureCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featureCardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  // Footer
  footer: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
  },
  footerContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  footerBrandText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.white,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  copyright: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
