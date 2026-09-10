// this is a js file cause tailwind config file (tailwind.config.js) only supports js
//
// LAYER 1 of the token pipeline: raw primitive ramps. Nothing in `src/containers`
// should reference these directly — they exist so LAYER 2 (the semantic CSS vars
// in `styles/main.scss`) has something to point at. Screens consume LAYER 3,
// the semantic Tailwind classes (`bg-surface`, `text-ink`, `border-line`, ...).
//
// The `gray` / `blue` / `green` / `red` / `slate` / `amber` ramps below are
// retained only because ~250 hardcoded utility classes still reference them.
// They are migration debt, not API: the eslint `no-restricted-syntax` rule in
// eslint.config.js warns on new uses inside containers.

/** Brand: deep petrol blue. Distinct from the default SaaS blue, and dark
 *  enough that the five category accents stay legible next to it. */
const BRAND = {
  50: "#F1F6F9",
  100: "#DEEAF1",
  200: "#BCD5E4",
  300: "#8FB8CF",
  400: "#5B92B0",
  500: "#336F90",
  600: "#235876",
  700: "#1D4760",
  800: "#1A3B4E",
  900: "#173141",
  950: "#0E1F2A",
};

/** Neutral: slightly cool, architectural. Replaces the Material `gray` ramp. */
const NEUTRAL = {
  0: "#FFFFFF",
  50: "#F8F9FA",
  100: "#F1F3F5",
  200: "#E5E8EC",
  300: "#D2D7DE",
  400: "#A6AEB9",
  500: "#7A8492",
  600: "#5A6472",
  700: "#434B57",
  800: "#2C333C",
  900: "#191E24",
  950: "#0D1115",
};

export const COLORS = {
  inherit: "inherit",
  transparent: "transparent",
  current: "currentColor",
  white: "#FFF",
  black: "#000",
  brand: BRAND,
  neutral: NEUTRAL,

  // ---- migration debt: still referenced by unmigrated screens ----
  gray: {
    50: "#FAFAFA",
    100: "#f5f5f5",
    125: "#D9D9D9",
    150: "#27272a",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    850: "#1b1b1e",
    900: "#212121",
    950: "#0B0B0B",
    960: "#1E1E1E",
  },
  red: {
    50: "#FFEBEE",
    100: "#FFCDD2",
    200: "#EF9A9A",
    300: "#E57373",
    400: "#EF5350",
    500: "#F44336",
    600: "#E53935",
    700: "#D32F2F",
    800: "#C62828",
    900: "#B71C1C",
  },
  blue: {
    50: "#E3F2FD",
    100: "#BBDEFB",
    200: "#90CAF9",
    300: "#64B5F6",
    400: "#42A5F5",
    500: "#2196F3",
    600: "#1E88E5",
    700: "#1976D2",
    800: "#1565C0",
    900: "#0D47A1",
  },
  green: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
    950: "#052E16",
  },
  amber: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  emerald: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
    800: "#065F46",
    900: "#064E3B",
  },
  slate: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },
};

// Four steps, not eight. `rounded-mid` / `rounded-lmid` were unused; `lg`/`md`/`sm`
// are overridden in tailwind.config.js to derive from `--radius` so the shadcn
// primitives stay in step with the app.
export const BORDER_RADIUS = {
  none: "0",
  sm: "4px",
  DEFAULT: "8px",
  md: "10px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  "3xl": "28px",
  full: "1000rem",
};

// Flat, tinted with the neutral ink rather than pure black — Material's
// three-layer elevations read as muddy on a bordered-card UI. `md` is new:
// five call sites already used `shadow-md`, which silently resolved to nothing.
export const BOX_SHADOW = {
  none: "none",
  sm: "0 1px 2px 0 rgb(13 17 21 / 0.05)",
  DEFAULT:
    "0 1px 3px 0 rgb(13 17 21 / 0.08), 0 1px 2px -1px rgb(13 17 21 / 0.06)",
  md: "0 4px 10px -2px rgb(13 17 21 / 0.09), 0 2px 4px -2px rgb(13 17 21 / 0.05)",
  lg: "0 12px 28px -8px rgb(13 17 21 / 0.14), 0 4px 8px -4px rgb(13 17 21 / 0.06)",
};

export const BREAKPOINTS = {
  sm: "600px",
  md: "900px",
  lg: "1200px",
  xl: "1536px",
};

export const FONT_WEIGHT = {
  normal: "400",
  medium: "500",
  bold: "700",
};

export const FONT_SIZE = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px

  // Display sizes. The UI scale above stops at 36px, which is why the landing
  // page used to reach past it into Tailwind's own defaults and three arbitrary
  // values — the only sizes over `4xl` anywhere in the app, each with its
  // tracking and leading spelled out by hand at the call site.
  //
  // Each of these carries its own leading and tracking, because tracking is
  // size-specific: letters read too far apart as they grow, so the working rule
  // in `docs/design-direction.md` §3 tightens anything above 2.4rem. The triple
  // is the token. A size on its own would let a caller take 88px type and
  // forget the -0.03em that is the difference between big text and typeset
  // text.
  //
  // Fluid, and deliberately `rem + vw` rather than bare `vw`: the rem term is
  // what keeps the type responding to browser zoom and to the reader's own font
  // size, which a pure viewport unit throws away.
  "display-sm": [
    "clamp(2rem, 1.4rem + 2.4vw, 2.75rem)", // 32 → 44px
    { lineHeight: "1.1", letterSpacing: "-0.02em" },
  ],
  "display-md": [
    "clamp(2.5rem, 1.5rem + 4vw, 4rem)", // 40 → 64px
    { lineHeight: "1.06", letterSpacing: "-0.025em" },
  ],
  "display-lg": [
    "clamp(2.5rem, 1rem + 6.5vw, 5.5rem)", // 40 → 88px
    { lineHeight: "1.02", letterSpacing: "-0.03em" },
  ],
};

export const LINE_HEIGHT = {
  none: "1",
  tight: "1.25",
  normal: "1.5",
  relaxed: "1.75",
  loose: "2",
};
