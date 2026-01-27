import React from 'react';
import { FeatureCardBase } from './FeatureCardBase';

type PrayerGuideFeatureCardProps = {
  onPress: () => void;
};

export const PrayerGuideFeatureCard: React.FC<PrayerGuideFeatureCardProps> = ({ onPress }) => {
  return (
    <FeatureCardBase
      title="Prayer Guide"
      description="Step-by-step guide to the 5 daily prayers"
      iconName="hand-left-outline"
      onPress={onPress}
      testID="prayer-guide-feature-card"
    />
  );
};
