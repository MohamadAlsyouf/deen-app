import React from 'react';
import { FeatureCardBase } from './FeatureCardBase';

interface DuaFeatureCardProps {
  onPress: () => void;
}

export const DuaFeatureCard: React.FC<DuaFeatureCardProps> = ({ onPress }) => {
  return (
    <FeatureCardBase
      title="Dua & Dhikr"
      description="Morning, evening, and daily supplications with Arabic text and translations"
      iconName="hand-left-outline"
      onPress={onPress}
      testID="dua-feature-card"
    />
  );
};
