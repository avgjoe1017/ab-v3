/**
 * Color definitions for bna-ui components
 * Maps to your existing theme system
 */
// Import theme tokens (path alias will resolve @/theme/tokens via baseUrl)
// Since we're in apps/mobile/theme/, we need relative path to src
const themeColors = {
  background: {
    primary: "#ffffff",
    secondary: "#f5f6f7",
    tertiary: "#eeeff0",
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    surfaceSubtle: "#f8f9fa",
  },
  text: {
    primary: "#212529",
    secondary: "#495057",
    tertiary: "#6c757d",
    muted: "#adb5bd",
    inverse: "#ffffff",
  },
  accent: {
    primary: "#212529",
    secondary: "#495057",
    tertiary: "#6c757d",
    highlight: "#212529",
  },
  semantic: {
    success: "#28a745",
    warning: "#ffc107",
    error: "#dc3545",
    info: "#17a2b8",
  },
  border: {
    default: "#dee2e6",
    subtle: "#e9ecef",
    strong: "#ced4da",
  },
};

export const Colors = {
  light: {
    background: themeColors.background.primary,
    foreground: themeColors.text.primary,
    card: themeColors.background.surface,
    cardForeground: themeColors.text.primary,
    primary: themeColors.accent.primary,
    primaryForeground: themeColors.text.inverse,
    secondary: themeColors.background.secondary,
    secondaryForeground: themeColors.text.primary,
    muted: themeColors.background.tertiary,
    mutedForeground: themeColors.text.tertiary,
    accent: themeColors.accent.primary,
    accentForeground: themeColors.text.inverse,
    destructive: themeColors.semantic.error,
    destructiveForeground: themeColors.text.inverse,
    border: themeColors.border.default,
    input: themeColors.border.default,
    ring: themeColors.accent.primary,
    text: themeColors.text.primary,
    textMuted: themeColors.text.tertiary,
    green: themeColors.semantic.success,
    red: themeColors.semantic.error,
    yellow: themeColors.semantic.warning,
    blue: themeColors.semantic.info,
  },
  dark: {
    background: themeColors.background.primary,
    foreground: themeColors.text.primary,
    card: themeColors.background.surface,
    cardForeground: themeColors.text.primary,
    primary: themeColors.accent.primary,
    primaryForeground: themeColors.text.inverse,
    secondary: themeColors.background.secondary,
    secondaryForeground: themeColors.text.primary,
    muted: themeColors.background.tertiary,
    mutedForeground: themeColors.text.tertiary,
    accent: themeColors.accent.primary,
    accentForeground: themeColors.text.inverse,
    destructive: themeColors.semantic.error,
    destructiveForeground: themeColors.text.inverse,
    border: themeColors.border.default,
    input: themeColors.border.default,
    ring: themeColors.accent.primary,
    text: themeColors.text.primary,
    textMuted: themeColors.text.tertiary,
    green: themeColors.semantic.success,
    red: themeColors.semantic.error,
    yellow: themeColors.semantic.warning,
    blue: themeColors.semantic.info,
  },
};

