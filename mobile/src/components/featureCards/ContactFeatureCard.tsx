import React from 'react';
import { FeatureCardBase } from './FeatureCardBase';

type ContactFeatureCardProps = {
  onPress: () => void;
};

export const ContactFeatureCard: React.FC<ContactFeatureCardProps> = ({ onPress }) => {
  return (
    <FeatureCardBase
      title="Contact"
      description="Send us feedback or questions"
      iconName="mail-outline"
      onPress={onPress}
      testID="feature-card-contact"
    />
  );
};


