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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Card, Header, Input, Button } from '@/components';
import { colors, spacing, typography } from '@/theme';
import { contactService } from '@/services/contactService';
import { ContactFormData } from '@/types/contact';
import { useAuth } from '@/hooks/useAuth';

export const ContactScreen: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      await contactService.submitContactForm({
        ...data,
        timestamp: new Date(),
        userId: user?.uid,
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Your message has been sent successfully!');
      setName('');
      setMessage('');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send message');
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    contactMutation.mutate({ name, email, message });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Contact Us" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Get in Touch</Text>
            <Text style={styles.infoText}>
              Have questions, suggestions, or feedback? We'd love to hear from you!
              Fill out the form below and we'll get back to you as soon as possible.
            </Text>
          </Card>

          <Card style={styles.formCard}>
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              autoCapitalize="words"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Message"
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message here..."
              multiline
              numberOfLines={6}
            />
            <Button
              title="Send Message"
              onPress={handleSubmit}
              loading={contactMutation.isPending}
              disabled={contactMutation.isPending}
            />
          </Card>

          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Connect With Us</Text>
            <Text style={styles.infoText}>
              Stay updated with the latest content and join our growing community of learners.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
});

