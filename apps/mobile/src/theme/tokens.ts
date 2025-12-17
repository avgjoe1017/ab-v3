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
    pink: "#f472b6",              // Soft pink (homepage accent, from design inspiration)
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
// Font Families - Using Inter (neutral, confident, adult font)
// Falls back to system font during font loading
const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  // Fallback for when fonts haven't loaded yet
  fallback: "System",
};

export const typography = {
  // Font Families
  fontFamily,
  
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
  
  // Text Styles - Bespoke Typography System
  // Following intentional, restrained approach with signature moments
  styles: {
    // 1. AFFIRMATION TITLE (SIGNATURE MOMENT)
    // Used ONLY for affirmation titles, main session titles, player screen title
    // This is the emotional anchor - use sparingly and intentionally
    affirmationTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 28,
      fontWeight: "600", // Semibold
      lineHeight: 34,
      letterSpacing: -0.3, // Slightly tight tracking for confidence
      color: colors.text.primary,
    },
    
    // 2. SECTION HEADINGS
    // "What do you need to hear today?", "Why this works", "Browse by Goal", screen titles
    sectionHeading: {
      fontFamily: fontFamily.medium,
      fontSize: 20,
      fontWeight: "500", // Medium - structural, not emotional
      lineHeight: 26,
      letterSpacing: -0.2, // Slightly tighter
      color: colors.text.primary,
    },
    
    // 3. CARD TITLES / PROGRAM TITLES
    // Program cards, session cards in Explore, library item titles
    cardTitle: {
      fontFamily: fontFamily.medium,
      fontSize: 17,
      fontWeight: "500", // Medium
      lineHeight: 22,
      letterSpacing: -0.1,
      color: colors.text.primary,
    },
    
    // 4. BODY COPY (Primary Reading)
    // Descriptions, "Why Alpha Waves Work" paragraphs, program explanations
    body: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      fontWeight: "400", // Regular
      lineHeight: 22, // Generous for reduced cognitive load
      letterSpacing: 0,
      color: colors.text.secondary,
    },
    
    // 5. METADATA / SUPPORTING TEXT
    // "Alpha 10Hz · 30 min", "Recommended: Morning · Evening", categories, session counts
    metadata: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      fontWeight: "400", // Regular
      lineHeight: 18,
      letterSpacing: 0.1, // Slightly increased tracking for clarity
      color: colors.text.tertiary,
    },
    
    // 6. LABELS / PILLS / TAGS
    // Category pills, filters (Sleep, Focus, Anxiety), "Beginner", "Deep Focus"
    label: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      fontWeight: "500", // Medium - prevents feeling fragile
      lineHeight: 16,
      letterSpacing: 0.6, // Wider tracking makes them feel deliberate
      color: colors.text.muted,
      // Note: No text transform - no all-caps
    },
    
    // 7. BUTTONS (Primary & Secondary)
    // "BEGIN", "Start Session", "Play Session"
    button: {
      fontFamily: fontFamily.medium,
      fontSize: 15,
      fontWeight: "500", // Medium
      lineHeight: 20,
      letterSpacing: 0.4,
      // Color handled by button component
      // Note: No text transform - let button shape do the work
    },
    
    // 8. CAPTION / FOOTNOTE / EDUCATIONAL ASIDES
    // "Research shows...", small explanatory blurbs, secondary educational notes
    caption: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      fontWeight: "400", // Regular
      lineHeight: 18,
      letterSpacing: 0.2,
      color: colors.text.tertiary,
    },
    
    // Legacy styles (deprecated - migrate to new system)
    // Keep for backward compatibility during migration
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

