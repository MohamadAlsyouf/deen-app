/**
 * Web-specific theme extensions
 * Only used when Platform.OS === 'web'
 */

import { colors } from './colors';

// CSS Transitions
export const transitions = {
  fast: 'all 0.15s ease-out',
  normal: 'all 0.25s ease-out',
  slow: 'all 0.4s ease-out',
  bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// CSS Animations as keyframe strings (for injection)
export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  fadeInUp: `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  fadeInScale: `
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `,
  glow: `
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(27, 67, 50, 0.3); }
      50% { box-shadow: 0 0 40px rgba(27, 67, 50, 0.5); }
    }
  `,
};

// Animation utility styles
export const animations = {
  fadeIn: {
    animationName: 'fadeIn',
    animationDuration: '0.4s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
  },
  fadeInUp: {
    animationName: 'fadeInUp',
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
  },
  fadeInScale: {
    animationName: 'fadeInScale',
    animationDuration: '0.4s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
  },
  slideInRight: {
    animationName: 'slideInRight',
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
  },
  float: {
    animationName: 'float',
    animationDuration: '3s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
  pulse: {
    animationName: 'pulse',
    animationDuration: '2s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
};

// Stagger animation delays
export const staggerDelay = (index: number, baseDelay = 0.1) => ({
  animationDelay: `${index * baseDelay}s`,
});

// Hover effect styles
export const hoverEffects = {
  lift: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  },
  scale: {
    transform: 'scale(1.02)',
  },
  glow: {
    boxShadow: `0 0 30px ${colors.primary}40`,
  },
  brighten: {
    filter: 'brightness(1.05)',
  },
};

// Web-specific shadows with blur
export const webShadows = {
  subtle: '0 2px 8px rgba(0, 0, 0, 0.06)',
  small: '0 4px 12px rgba(0, 0, 0, 0.08)',
  medium: '0 8px 24px rgba(0, 0, 0, 0.12)',
  large: '0 16px 48px rgba(0, 0, 0, 0.16)',
  xl: '0 24px 64px rgba(0, 0, 0, 0.2)',
  colored: `0 8px 32px ${colors.primary}30`,
  glow: `0 0 40px ${colors.primary}20`,
};

// Glassmorphism effects
export const glass = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  dark: {
    backgroundColor: 'rgba(27, 67, 50, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
};

// Gradient backgrounds
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
  secondary: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondaryLight} 100%)`,
  accent: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
  hero: `linear-gradient(135deg, ${colors.gradient.start} 0%, ${colors.gradient.middle} 50%, ${colors.gradient.end} 100%)`,
  subtle: `linear-gradient(180deg, ${colors.backgroundAlt} 0%, ${colors.background} 100%)`,
  card: `linear-gradient(145deg, ${colors.background} 0%, ${colors.surface} 100%)`,
  shimmer: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`,
};

// Web-specific border styles
export const borders = {
  subtle: `1px solid ${colors.border}`,
  accent: `2px solid ${colors.primary}`,
  gradient: `2px solid transparent`,
};

// Focus ring styles for accessibility
export const focusRing = {
  outline: `2px solid ${colors.accent}`,
  outlineOffset: '2px',
};

// Scrollbar styles
export const scrollbar = {
  width: '8px',
  track: colors.surface,
  thumb: colors.primary,
  thumbHover: colors.primaryLight,
};

// Container max widths
export const containers = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

// Breakpoint helpers
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};
