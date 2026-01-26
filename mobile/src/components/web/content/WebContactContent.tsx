/**
 * WebContactContent - Contact page with luxury styling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { colors } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { useAuth } from '@/hooks/useAuth';
import { contactService } from '@/services/contactService';
import type { ContactFormData } from '@/types/contact';

export const WebContactContent: React.FC = () => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 1000;

  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');

  const buttonHover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 32px rgba(27, 67, 50, 0.3)',
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      await contactService.submitContactForm({
        ...data,
        timestamp: new Date(),
        userId: user?.uid,
      });
    },
    onSuccess: () => {
      Alert.alert('Message Sent!', 'Thank you for reaching out. We\'ll get back to you soon.');
      setName('');
      setMessage('');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    contactMutation.mutate({ name, email, message });
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderIcon}>
          <Ionicons name="mail" size={32} color={colors.accent} />
        </View>
        <Text style={styles.pageTitle}>Get in Touch</Text>
        <Text style={styles.pageSubtitle}>
          Have questions, suggestions, or feedback? We'd love to hear from you!
        </Text>
      </View>

      <View style={[styles.contentContainer, isWide && styles.contentContainerWide]}>
        {/* Contact Form */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Send us a Message</Text>
            <Text style={styles.formSubtitle}>
              Fill out the form below and we'll get back to you as soon as possible.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Write your message here..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={contactMutation.isPending}
              activeOpacity={0.9}
              // @ts-ignore
              onMouseEnter={buttonHover.handlers.onMouseEnter}
              onMouseLeave={buttonHover.handlers.onMouseLeave}
              style={[
                styles.submitButton,
                buttonHover.style,
                contactMutation.isPending && styles.submitButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              {contactMutation.isPending ? (
                <Text style={styles.submitButtonText}>Sending...</Text>
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Send Message</Text>
                  <Ionicons name="send" size={18} color={colors.text.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['#0D2818', '#1B4332']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.infoPattern} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Connect With Us</Text>
              <Text style={styles.infoDescription}>
                Stay updated with the latest content and join our growing community of learners.
              </Text>

              <View style={styles.contactItems}>
                <View style={styles.contactItem}>
                  <View style={styles.contactIconWrap}>
                    <Ionicons name="mail" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.contactTextWrap}>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>support@deenlearning.com</Text>
                  </View>
                </View>

                <View style={styles.contactItem}>
                  <View style={styles.contactIconWrap}>
                    <Ionicons name="globe" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.contactTextWrap}>
                    <Text style={styles.contactLabel}>Website</Text>
                    <Text style={styles.contactValue}>www.deenlearning.com</Text>
                  </View>
                </View>

                <View style={styles.contactItem}>
                  <View style={styles.contactIconWrap}>
                    <Ionicons name="time" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.contactTextWrap}>
                    <Text style={styles.contactLabel}>Response Time</Text>
                    <Text style={styles.contactValue}>Within 24-48 hours</Text>
                  </View>
                </View>
              </View>

              <View style={styles.socialSection}>
                <Text style={styles.socialTitle}>Follow Us</Text>
                <View style={styles.socialIcons}>
                  {['logo-twitter', 'logo-instagram', 'logo-youtube'].map((icon) => (
                    <TouchableOpacity key={icon} style={styles.socialIcon} activeOpacity={0.7}>
                      <Ionicons name={icon as any} size={22} color={colors.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* FAQ Teaser */}
      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        <Text style={styles.faqDescription}>
          Looking for quick answers? Check out some common questions below.
        </Text>
        <View style={styles.faqItems}>
          {[
            { q: 'Is the app free to use?', a: 'Yes! Deen Learning is completely free for all users.' },
            { q: 'Where does the content come from?', a: 'All content is sourced from authentic Islamic texts and verified scholars.' },
            { q: 'Can I use this offline?', a: 'Some features will be available offline in future updates.' },
          ].map((faq, index) => (
            <View
              key={index}
              style={[
                styles.faqItem,
                {
                  // @ts-ignore
                  animation: `fadeInUp 0.4s ease-out ${0.3 + index * 0.1}s forwards`,
                  opacity: 0,
                },
              ]}
            >
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 40,
    paddingBottom: 60,
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  pageHeaderIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  contentContainer: {
    gap: 32,
    marginBottom: 48,
  },
  contentContainerWide: {
    flexDirection: 'row',
  },
  formContainer: {
    flex: 1,
    minWidth: 400,
  },
  formCard: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 40,
    // @ts-ignore
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  formSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 32,
    lineHeight: 24,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  input: {
    backgroundColor: '#FAFBFA',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
    outlineWidth: 0,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 18,
    gap: 10,
    overflow: 'hidden',
    // @ts-ignore
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(27, 67, 50, 0.2)',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  infoContainer: {
    flex: 1,
    minWidth: 340,
    maxWidth: 400,
  },
  infoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
  },
  infoPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    // @ts-ignore
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='%23D4A373' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: '60px 60px',
  },
  infoContent: {
    padding: 40,
    height: '100%',
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.white,
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  infoDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  contactItems: {
    gap: 20,
    marginBottom: 32,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactTextWrap: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  socialSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 24,
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  faqSection: {
    backgroundColor: '#FAFBFA',
    borderRadius: 24,
    padding: 40,
  },
  faqTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  faqDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 32,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  faqItems: {
    gap: 20,
  },
  faqItem: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    // @ts-ignore
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  faqAnswer: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 24,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
