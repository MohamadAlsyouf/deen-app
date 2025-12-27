import React from 'react';
import { FeatureCardBase } from './FeatureCardBase';

type AboutFeatureCardProps = {
  onPress: () => void;
};

export const AboutFeatureCard: React.FC<AboutFeatureCardProps> = ({ onPress }) => {
  return (
    <FeatureCardBase
      title="About"
      description="Learn about our mission and values"
      iconName="information-circle-outline"
      onPress={onPress}
      testID="feature-card-about"
    />
  );
};


