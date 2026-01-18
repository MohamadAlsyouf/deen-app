import React from "react";
import { FeatureCardBase } from "./FeatureCardBase";

type PillarsFeatureCardProps = {
  onPress: () => void;
};

export const PillarsFeatureCard: React.FC<PillarsFeatureCardProps> = ({
  onPress,
}) => {
  return (
    <FeatureCardBase
      title="The Pillars of Islam"
      description="Learn the 5 Pillars of Islam & 6 Pillars of Iman"
      iconName="compass-outline"
      onPress={onPress}
      testID="feature-card-pillars"
    />
  );
};
