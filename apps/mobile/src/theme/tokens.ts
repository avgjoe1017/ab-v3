/**
 * Design Tokens
 * Single source of truth for colors, typography, spacing, and visual effects
 */

// Colors
export const colors = {
  // Background & Surface
  background: {
    primary: "#0f172a",      // Dark slate (main background)
    secondary: "#1e1b4b",    // Dark indigo (cards, surfaces)
    tertiary: "#1e293b",     // Slate (elevated surfaces)
    surface: "rgba(255, 255, 255, 0.05)",  // Semi-transparent surface
    surfaceElevated: "rgba(255, 255, 255, 0.1)",  // Elevated surface
  },
  
  // Text
  text: {
    primary: "#ffffff",           // White (headings, important text)
    secondary: "rgba(196, 181, 253, 0.95)",  // Light purple (body text)
    tertiary: "rgba(196, 181, 253, 0.7)",   // Muted purple (subtle text)
    muted: "rgba(196, 181, 253, 0.5)",      // Very muted (labels, hints)
    inverse: "#0f172a",          // Dark text for light backgrounds
  },
  
  // Accent Colors
  accent: {
    primary: "#6366f1",          // Indigo
    secondary: "#8b5cf6",        // Purple
    tertiary: "#a855f7",         // Purple-violet
    highlight: "#FDE047",        // Yellow (play button, highlights)
  },
  
  // Semantic States
  semantic: {
    success: "#10b981",          // Green
    warning: "#f59e0b",          // Amber
    error: "#ef4444",            // Red
    info: "#3b82f6",             // Blue
  },
  
  // Borders
  border: {
    default: "rgba(255, 255, 255, 0.1)",
    subtle: "rgba(255, 255, 255, 0.05)",
    strong: "rgba(255, 255, 255, 0.2)",
  },
  
  // Gradients (for LinearGradient components)
  gradients: {
    background: ["#0f172a", "#1e1b4b", "#2e1065"],
    surface: ["#1e1b4b", "#312e81", "#1e293b"],
    accent: ["#6366f1", "#9333ea"],
    profile: ["#8b5cf6", "#6366f1", "#3b82f6"],
  },
} as const;

// Typography Scale
export const typography = {
  // Font Families
  fontFamily: {
    regular: "System",  // Will use platform default
    medium: "System",
    semibold: "System",
    bold: "System",
  },
  
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },
  
  // Font Weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  
  // Line Heights
  lineHeight: {
    tight: 20,
    normal: 24,
    relaxed: 28,
    loose: 32,
    extraLoose: 36,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
  
  // Text Styles (composed styles for common patterns)
  styles: {
    h1: {
      fontSize: 28,
      fontWeight: "600",
      lineHeight: 36,
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    h2: {
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 32,
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 28,
      letterSpacing: 0.5,
      color: colors.text.primary,
    },
    body: {
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 24,
      color: colors.text.secondary,
    },
    caption: {
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 20,
      color: colors.text.tertiary,
    },
  },
} as const;

// Spacing Scale (4px base unit)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// Border Radius
export const radius = {
  none: 0,
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  full: 9999,  // Pill shape
} as const;

// Shadows (platform-specific)
export const shadows = {
  // iOS shadow style
  ios: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
  },
  
  // Android elevation
  android: {
    sm: { elevation: 2 },
    md: { elevation: 4 },
    lg: { elevation: 8 },
    xl: { elevation: 16 },
  },
  
  // Glow effects (for accent elements)
  glow: {
    accent: {
      shadowColor: "#6366f1",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
    highlight: {
      shadowColor: "#FDE047",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
  },
} as const;

// Layout Constants
export const layout = {
  // Tap Targets (minimum 44px for accessibility)
  tapTargetMin: 44,
  
  // Screen Padding
  screenPadding: spacing[6],  // 24px
  
  // Card Padding
  cardPadding: spacing[6],    // 24px
  
  // Section Spacing
  sectionSpacing: spacing[10], // 40px
} as const;

// Export theme object for easy access
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  layout,
} as const;

export type Theme = typeof theme;

