/**
 * Hook for managing hover states on web
 * Returns empty state on native platforms
 */

import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

interface WebHoverState {
  isHovered: boolean;
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  style: Record<string, any>;
}

interface UseWebHoverOptions {
  hoverStyle?: Record<string, any>;
  transition?: string;
}

export const useWebHover = (options: UseWebHoverOptions = {}): WebHoverState => {
  const [isHovered, setIsHovered] = useState(false);

  const onMouseEnter = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  }, []);

  const style = useMemo(() => {
    if (Platform.OS !== 'web') return {};

    const baseStyle: Record<string, any> = {
      transition: options.transition || 'all 0.25s ease-out',
      cursor: 'pointer',
    };

    if (isHovered && options.hoverStyle) {
      return { ...baseStyle, ...options.hoverStyle };
    }

    return baseStyle;
  }, [isHovered, options.hoverStyle, options.transition]);

  return {
    isHovered,
    handlers: {
      onMouseEnter,
      onMouseLeave,
    },
    style,
  };
};

// Preset hover effects
export const useCardHover = () => useWebHover({
  hoverStyle: {
    transform: 'translateY(-6px) scale(1.01)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
});

export const useButtonHover = () => useWebHover({
  hoverStyle: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(27, 67, 50, 0.3)',
  },
  transition: 'all 0.2s ease-out',
});

export const useLinkHover = () => useWebHover({
  hoverStyle: {
    opacity: 0.8,
  },
  transition: 'opacity 0.15s ease-out',
});

export const useScaleHover = () => useWebHover({
  hoverStyle: {
    transform: 'scale(1.05)',
  },
  transition: 'transform 0.2s ease-out',
});

export const useGlowHover = (color = 'rgba(27, 67, 50, 0.4)') => useWebHover({
  hoverStyle: {
    boxShadow: `0 0 40px ${color}`,
  },
  transition: 'box-shadow 0.3s ease-out',
});
