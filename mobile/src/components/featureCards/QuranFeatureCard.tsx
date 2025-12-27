import React from 'react';
import { FeatureCardBase } from './FeatureCardBase';

type QuranFeatureCardProps = {
  onPress: () => void;
};

export const QuranFeatureCard: React.FC<QuranFeatureCardProps> = ({ onPress }) => {
  return (
    <FeatureCardBase
      title="Quran"
      description="Browse chapters and read verses with transliteration"
      iconName="book-outline"
      onPress={onPress}
      testID="feature-card-quran"
    />
  );
};


