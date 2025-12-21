/**
 * Design Tokens - "TripGlide" Inspired Aesthetic
 * Clean, minimal palette with dark accents on white backgrounds
 * Based on: #212529 (dark), #f5f6f7 (light gray), #ffffff (white)
 */

// Colors - Minimal, Clean, Modern
export const colors = {
  // Background & Surface - Pure whites and light grays
  background: {
    primary: "#ffffff",           // Pure white (main background)
    secondary: "#f5f6f7",         // Light gray
    tertiary: "#eeeff0",          // Slightly darker gray
    
    // Card surfaces
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    surfaceSubtle: "#f8f9fa",
  },
  
  // Text - Dark charcoal for contrast
  text: {
    primary: "#212529",           // Near black (headings, main text)
    secondary: "#495057",         // Dark gray (body text)
    tertiary: "#6c757d",          // Medium gray (subtle text)
    muted: "#adb5bd",             // Light gray (hints, placeholders)
    inverse: "#ffffff",           // White text on dark backgrounds
    onGlass: "#212529",           // Text on glass surfaces
  },
  
  // Accent Colors - Minimal, with soft DuotoneCard colors
  accent: {
    primary: "#212529",           // Dark charcoal (primary actions)
    secondary: "#495057",         // Medium dark (secondary elements)
    tertiary: "#6c757d",          // Gray accent
    highlight: "#212529",         // Dark for buttons
    // DuotoneCard palettes (kept for session/program cards)
    rose: "#c8a0b0",
    sage: "#90b0a0",
  },
  
  // Semantic States
  semantic: {
    success: "#28a745",           // Green
    warning: "#ffc107",           // Yellow
    error: "#dc3545",             // Red
    info: "#17a2b8",              // Teal
  },
  
  // Borders - Subtle gray borders
  border: {
    default: "#dee2e6",           // Standard border
    subtle: "#e9ecef",            // Subtle border
    strong: "#ced4da",            // Stronger border
    glass: "rgba(0, 0, 0, 0.08)", // Glass border
  },
  
  // Gradients - Minimal
  gradients: {
    background: ["#ffffff", "#f8f9fa", "#ffffff"],
    calm: ["#ffffff", "#fafbfc", "#ffffff"],
    player: ["#f8f9fa", "#ffffff", "#f8f9fa"],
    hero: ["#f5f6f7", "#ffffff", "#f5f6f7"],
    sleep: ["#f0f2f4", "#f8f9fa", "#f5f6f7"],
    focus: ["#ffffff", "#f8f9fa", "#ffffff"],
    energy: ["#fafbfc", "#ffffff", "#fafbfc"],
    glass: ["rgba(255,255,255,0.95)", "rgba(255,255,255,0.9)"],
    surface: ["rgba(255,255,255,1)", "rgba(248,249,250,1)"],
    profile: ["#6c757d", "#495057", "#343a40"],
    accent: ["#343a40", "#212529"],
  },
} as const;

// Typography Scale
// Font Families - Using Instrument Sans style (Inter as fallback until we add Instrument Sans)
const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  fallback: "System",
};

export const typography = {
  fontFamily,
  
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
  
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  
  lineHeight: {
    tight: 20,
    normal: 24,
    relaxed: 28,
    loose: 32,
    extraLoose: 36,
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
  
  // Text Styles
  styles: {
    // 1. AFFIRMATION TITLE (SIGNATURE MOMENT)
    affirmationTitle: {
      fontFamily: fontFamily.bold,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
      letterSpacing: -0.3,
      color: colors.text.primary,
    },
    
    // 2. SECTION HEADINGS
    sectionHeading: {
      fontFamily: fontFamily.semibold,
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 26,
      letterSpacing: -0.2,
      color: colors.text.primary,
    },
    
    // 3. CARD TITLES
    cardTitle: {
      fontFamily: fontFamily.medium,
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 20,
      letterSpacing: 0,
      color: colors.text.primary,
    },
    
    // 4. BODY COPY
    body: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      fontWeight: "400",
      lineHeight: 22,
      letterSpacing: 0,
      color: colors.text.secondary,
    },
    
    // 5. METADATA
    metadata: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      fontWeight: "400",
      lineHeight: 18,
      letterSpacing: 0,
      color: colors.text.tertiary,
    },
    
    // 6. LABELS
    label: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 16,
      letterSpacing: 0.4,
      color: colors.text.muted,
    },
    
    // 7. BUTTONS
    button: {
      fontFamily: fontFamily.medium,
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 20,
      letterSpacing: 0,
    },
    
    // 8. CAPTION
    caption: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      fontWeight: "400",
      lineHeight: 16,
      letterSpacing: 0,
      color: colors.text.tertiary,
    },
    
    // Legacy styles
    h1: {
      fontFamily: fontFamily.bold,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    h2: {
      fontFamily: fontFamily.semibold,
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 30,
      letterSpacing: -0.3,
      color: colors.text.primary,
    },
    h3: {
      fontFamily: fontFamily.semibold,
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 26,
      letterSpacing: 0,
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

// Border Radius - Generous rounded corners
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  full: 9999,
} as const;

// Shadows - Subtle, clean shadows
export const shadows = {
  ios: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    xl: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
    },
  },
  
  android: {
    sm: { elevation: 1 },
    md: { elevation: 3 },
    lg: { elevation: 6 },
    xl: { elevation: 12 },
  },
  
  // Card shadow
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Glass shadows - subtle
  glass: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  
  // Tab bar shadow
  tabBar: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Glow effects (kept for special elements)
  glow: {
    accent: {
      shadowColor: "#212529",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 6,
    },
    highlight: {
      shadowColor: "#212529",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

// Layout Constants
export const layout = {
  tapTargetMin: 44,
  screenPadding: spacing[5],
  cardPadding: spacing[4],
  sectionSpacing: spacing[8],
} as const;

// Export theme object
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  layout,
} as const;

export type Theme = typeof theme;
