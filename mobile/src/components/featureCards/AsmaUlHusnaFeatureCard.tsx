import React from 'react';
import { FeatureCardBase } from './FeatureCardBase';

type AsmaUlHusnaFeatureCardProps = {
  onPress: () => void;
};

export const AsmaUlHusnaFeatureCard: React.FC<AsmaUlHusnaFeatureCardProps> = ({ onPress }) => {
  return (
    <FeatureCardBase
      title="99 Names of Allah"
      description="Learn the beautiful names and attributes of Allah"
      iconName="star-outline"
      onPress={onPress}
      testID="feature-card-asma-ul-husna"
    />
  );
};

