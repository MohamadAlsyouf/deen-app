/**
 * Animated view component for web
 * Provides entrance animations and staggered effects
 */

import React, { useEffect, useState } from 'react';
import { View, ViewStyle, StyleProp, Platform } from 'react-native';
import { animations, staggerDelay, keyframes } from '@/theme/web';

// Inject keyframes into document head (only once)
let keyframesInjected = false;

const injectKeyframes = () => {
  if (Platform.OS !== 'web' || keyframesInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = Object.values(keyframes).join('\n');
  document.head.appendChild(style);
  keyframesInjected = true;
};

type AnimationType = 'fadeIn' | 'fadeInUp' | 'fadeInScale' | 'slideInRight' | 'float' | 'pulse' | 'none';

interface WebAnimatedViewProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  staggerIndex?: number;
  staggerBaseDelay?: number;
  duration?: string;
  style?: StyleProp<ViewStyle>;
}

export const WebAnimatedView: React.FC<WebAnimatedViewProps> = ({
  children,
  animation = 'fadeInUp',
  delay = 0,
  staggerIndex,
  staggerBaseDelay = 0.08,
  duration,
  style,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      injectKeyframes();
      // Small delay to ensure styles are ready
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(true);
    }
  }, []);

  if (Platform.OS !== 'web') {
    return <View style={style}>{children}</View>;
  }

  if (animation === 'none') {
    return <View style={style}>{children}</View>;
  }

  const animationStyle = animations[animation] || animations.fadeIn;
  const staggerStyle = staggerIndex !== undefined ? staggerDelay(staggerIndex, staggerBaseDelay) : {};

  const webStyle: any = {
    opacity: mounted ? undefined : 0,
    ...animationStyle,
    ...staggerStyle,
    ...(delay > 0 ? { animationDelay: `${delay}s` } : {}),
    ...(duration ? { animationDuration: duration } : {}),
  };

  return (
    <View style={[style, webStyle]}>
      {children}
    </View>
  );
};

// Stagger container for animating multiple children
interface WebStaggerContainerProps {
  children: React.ReactNode;
  animation?: AnimationType;
  baseDelay?: number;
  style?: StyleProp<ViewStyle>;
}

export const WebStaggerContainer: React.FC<WebStaggerContainerProps> = ({
  children,
  animation = 'fadeInUp',
  baseDelay = 0.08,
  style,
}) => {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        return (
          <WebAnimatedView
            animation={animation}
            staggerIndex={index}
            staggerBaseDelay={baseDelay}
          >
            {child}
          </WebAnimatedView>
        );
      })}
    </View>
  );
};
