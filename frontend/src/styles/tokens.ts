/**
 * Design Tokens
 * -----------------------------------------------------------------------------
 * Centralised styling system for the wallet UI.
 *
 * Goals:
 * - Ensure visual consistency across screens
 * - Avoid hardcoding colours, spacing, and typography
 * - Enable easy theming and refactoring
 *
 * Usage:
 * import { tokens } from "../styles/tokens";
 *
 * Example:
 * backgroundColor: tokens.colours.brandBlue
 * padding: tokens.spacing.lg
 */

export const tokens = {
  /**
   * Colour palette
   * ---------------------------------------------------------------------------
   * Includes:
   * - Core surfaces (backgrounds, cards)
   * - Brand system (primary + legacy compatibility)
   * - Text hierarchy (light + dark modes)
   * - UI states (error, borders, overlays)
   */
  colours: {
    // Base surfaces
    bg: "#0F1115",
    surface: "#171B22",
    surfaceAlt: "#1E2430",
    cardLight: "#F5F6F8",
    previewSurface: "#DADDE5",

    // Brand colours (primary system)
    brandBlue: "#285CD4",
    brandBlueMid: "#4C56DB",
    brandPurple: "#7253D4",
    brandPink: "#B971B5",

    // Extended brand (used across older screens)
    brandPrimary: "#5B73F2",
    brandSecondary: "#4F6BF0",

    // Absolute colours
    white: "#FFFFFF",
    black: "#000000",

    // Text hierarchy (light UI)
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.68)",
    textMuted: "#5D6475",
    textDark: "#111111",
    textCard: "#1F1F2E",

    // Text hierarchy (dark-on-light UI)
    textBodyDark: "#4B4B4B",
    textMutedDark: "#666666",

    // Borders
    borderSubtle: "rgba(255,255,255,0.08)",
    borderLight: "rgba(255,255,255,0.34)",
    borderInput: "rgba(255,255,255,0.08)",
    borderDefault: "#D7DBEB",

    // Shadows
    shadow: "#000000",

    // Error states
    errorBg: "#FEE2E2",
    errorText: "#B91C1C",

    // Tab / segmented control
    tabInactive: "rgba(255,255,255,0.58)",
    tabActiveBg: "rgba(255,255,255,0.92)",
    tabText: "#F5F7FF",
    segmentedBg: "rgba(255,255,255,0.16)",
    segmentedActive: "#6A79F6",

    // Tab bar gradient
    tabGradientStart: "#141A24",
    tabGradientMid: "#1A2332",
    tabGradientEnd: "#222C3F",

    // Overlays & camera UI
    overlayDark: "rgba(0,0,0,0.20)",
    overlayLight: "rgba(0,0,0,0.12)",
    scanFrameMuted: "rgba(255,255,255,0.55)",
  },

  /**
   * Gradient definitions
   * ---------------------------------------------------------------------------
   * Used for screen backgrounds and key visual surfaces.
   */
  gradients: {
    primary: ["#285CD4", "#4C56DB", "#7253D4", "#B971B5"] as const,
  },

  /**
   * Spacing scale
   * ---------------------------------------------------------------------------
   * Standardised spacing system for layout rhythm.
   *
   * Includes:
   * - Core spacing scale (xxs → xxl)
   * - Compact spacing for dense UI areas
   * - Screen-level spacing helpers
   */
  spacing: {
    xxs: 4,
    xs: 6,
    compact: 8,
    sm: 10,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,

    // Screen-level spacing
    screenX: 20,
    screenTop: 60,
    screenTopCompact: 50,
    screenBottom: 80,

    // Component spacing
    cardPadding: 20,
    cardPaddingLarge: 24,
  },

  /**
   * Border radius system
   * ---------------------------------------------------------------------------
   * Ensures consistent rounding across all UI elements.
   */
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    xl: 28,
    xxl: 32,

    // Common components
    card: 34,
    panel: 26,
    input: 18,
    button: 24,

    // Fully rounded elements (buttons, pills)
    pill: 999,

    // Special UI elements
    scanFrame: 18,
    segment: 22,
    segmentInner: 18,
  },

  /**
   * Semantic layout spacing
   * ---------------------------------------------------------------------------
   * Purpose-based spacing aliases used when the spacing meaning is clearer than
   * the raw size scale.
   */
  layoutSpacing: {
    cardBody: 16,
    cardBodyLg: 18,
    cardGap: 14,
    cardGapLg: 18,
    sectionGap: 20,
    screenBottomLarge: 120,
  },

  /**
   * Typography scale
   * ---------------------------------------------------------------------------
   * Defines font sizes and line heights for readability and hierarchy.
   */
  typography: {
    // Small labels
    tabLabel: 12,

    // Body text
    body: 16,
    bodySmall: 15,
    bodyLg: 18,
    bodyLineHeight: 24,

    // Supporting text
    supporting: 17,
    supportingLineHeight: 28,

    // Titles
    title: 24,
    titleLarge: 26, 
    titleLineHeight: 30,

    // State titles
    stateTitle: 22,
    stateTitleLineHeight: 28,

    // Error text
    error: 15,
    errorLineHeight: 22,

    // Buttons / misc
    smallButton: 14,
    sectionTitle: 18,
    button: 16,
    medium: 16,
    bold: 18,
  },

  /**
   * Button system
   * ---------------------------------------------------------------------------
   * Shared sizing and typography for consistent actions.
   */
  buttons: {
    height: 52,
    compactHeight: 40,
    borderRadius: 999,
    fontSize: 16,
    smallFontSize: 14,
    fontWeight: "700" as const,
    smallFontWeight: "600" as const,
    borderWidth: 1.5,
  },

  /**
   * Card & layout sizing
   * ---------------------------------------------------------------------------
   * Shared dimensions for reusable UI components.
   */
  cards: {
    heroMinHeight: 360,
    cameraMaxWidth: 320,
    cameraFrameOuter: 220,
    cameraFrameInner: 190,
    cameraStateMinHeight: 300,
    segmentedMaxWidth: 420,
  },

  /**
   * Shadow system
   * ---------------------------------------------------------------------------
   * Provides consistent elevation across components.
   */
  shadows: {
    floating: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 24,
      elevation: 8,
    },
    card: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.14,
      shadowRadius: 40,
      elevation: 8,
    },
    softCard: {
      shadowColor: "#000000",
      shadowOpacity: 0.14,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
  },

  /**
   * Tab bar layout
   * ---------------------------------------------------------------------------
   * Controls positioning and sizing of the bottom navigation.
   */
  tabBar: {
    height: 84,
    bottom: 16,
    sideInset: 16,
  },
};