import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/theme/colors';

type OverallProgressCircleProps = {
  progress: number; // 0-100
  size?: number;
};

export const OverallProgressCircle: React.FC<OverallProgressCircleProps> = ({
  progress,
  size = 80,
}) => {
  const strokeWidth = 6;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  if (Platform.OS === 'web') {
    // Use conic-gradient for web
    const angle = (clampedProgress / 100) * 360;
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View
          style={[
            styles.circleWeb,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              background: `conic-gradient(from -90deg, ${colors.accent} ${angle}deg, rgba(255,255,255,0.2) ${angle}deg)`,
            } as any,
          ]}
        >
          <View
            style={[
              styles.innerCircle,
              {
                width: size - strokeWidth * 2,
                height: size - strokeWidth * 2,
                borderRadius: (size - strokeWidth * 2) / 2,
              },
            ]}
          >
            <Text style={[styles.progressText, { fontSize: size * 0.2 }]}>
              {Math.round(clampedProgress)}%
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // For native, use two half-circles approach
  const halfSize = size / 2;
  const rotation = (clampedProgress / 100) * 360;

  // First half: 0-180 degrees (right side rotating down)
  // Second half: 180-360 degrees (left side rotating down)
  const firstHalfRotation = Math.min(rotation, 180);
  const secondHalfRotation = Math.max(0, rotation - 180);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle (track) */}
      <View
        style={[
          styles.backgroundCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          },
        ]}
      />

      {/* First half (0-180 degrees) - right side */}
      <View
        style={[
          styles.halfCircleContainer,
          {
            width: halfSize,
            height: size,
            left: halfSize,
          },
        ]}
      >
        <View
          style={[
            styles.halfCircleProgress,
            {
              width: halfSize,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderLeftWidth: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              transform: [
                { translateX: -halfSize / 2 },
                { rotate: `${firstHalfRotation - 180}deg` },
                { translateX: halfSize / 2 },
              ],
              opacity: clampedProgress > 0 ? 1 : 0,
            },
          ]}
        />
      </View>

      {/* Second half (180-360 degrees) - left side */}
      <View
        style={[
          styles.halfCircleContainer,
          {
            width: halfSize,
            height: size,
            left: 0,
          },
        ]}
      >
        <View
          style={[
            styles.halfCircleProgress,
            {
              width: halfSize,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderRightWidth: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              transform: [
                { translateX: halfSize / 2 },
                { rotate: `${secondHalfRotation - 180}deg` },
                { translateX: -halfSize / 2 },
              ],
              opacity: clampedProgress > 50 ? 1 : 0,
            },
          ]}
        />
      </View>

      {/* Inner circle with text */}
      <View
        style={[
          styles.innerCircleNative,
          {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
          },
        ]}
      >
        <Text style={[styles.progressText, { fontSize: size * 0.2 }]}>
          {Math.round(clampedProgress)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWeb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  halfCircleContainer: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  halfCircleProgress: {
    position: 'absolute',
    top: 0,
    borderColor: colors.accent,
  },
  innerCircleNative: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  progressText: {
    color: colors.text.white,
    fontWeight: '700',
  },
});
