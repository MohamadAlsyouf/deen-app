import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Header } from '@/components';
import { colors, spacing, typography } from '@/theme';

export const AboutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header title="About Us" />
      </View>
      <ScrollView
        style={[styles.scrollView, Platform.OS === 'web' && styles.webScrollView]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <Card style={styles.card}>
          <Text style={styles.heading}>Our Mission</Text>
          <Text style={styles.text}>
            Deen Learning is dedicated to making Islamic knowledge accessible, understandable,
            and engaging for Muslims around the world. We believe that learning about our Deen
            should be a beautiful and enriching experience.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.heading}>What We Offer</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>
                Comprehensive lessons on the fundamentals of Islam
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>
                Easy-to-understand explanations of Quranic verses
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>
                Guidance on daily Islamic practices and etiquette
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>
                Stories from the lives of the Prophets and companions
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.heading}>Our Vision</Text>
          <Text style={styles.text}>
            We envision a world where every Muslim has the tools and resources they need to
            deepen their understanding of Islam and strengthen their relationship with Allah.
            Through education, community, and dedication, we strive to be a trusted companion
            on your spiritual journey.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.heading}>Our Values</Text>
          <Text style={styles.text}>
            <Text style={styles.boldText}>Authenticity:</Text> All content is based on authentic
            Islamic sources.{'\n\n'}
            <Text style={styles.boldText}>Accessibility:</Text> Making knowledge available to everyone,
            everywhere.{'\n\n'}
            <Text style={styles.boldText}>Excellence:</Text> Commitment to quality in everything we create.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  scrollView: {
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
  content: {
    padding: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '600',
    color: colors.primary,
  },
  list: {
    marginTop: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  listBullet: {
    ...typography.body,
    color: colors.primary,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  listText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
});

