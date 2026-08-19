/* eslint-disable @typescript-eslint/no-var-requires */
const plugin = require("tailwindcss/plugin");

const theme = require("./src/styles/configs/tailwind-theme.js");
const { COLORS, BORDER_RADIUS, BOX_SHADOW, BREAKPOINTS } = theme;

/** LAYER 3 of the token pipeline: the semantic classes screens actually write.
 *  Every entry resolves to a CSS variable declared in `src/styles/main.scss`,
 *  so a colour decision is changed in exactly one place. */
const withAlpha = (cssVar) => `rgb(var(${cssVar}) / <alpha-value>)`;

const SEMANTIC_COLORS = {
  surface: {
    DEFAULT: withAlpha("--surface"),
    raised: withAlpha("--surface-raised"),
    sunken: withAlpha("--surface-sunken"),
    inset: withAlpha("--surface-inset"),
  },
  ink: {
    DEFAULT: withAlpha("--ink"),
    muted: withAlpha("--ink-muted"),
    subtle: withAlpha("--ink-subtle"),
    inverse: withAlpha("--ink-inverse"),
  },
  line: {
    DEFAULT: withAlpha("--line"),
    strong: withAlpha("--line-strong"),
  },
  // Merges into the `brand` primitive ramp, so `bg-brand-600` (primitive) and
  // `bg-brand` (semantic) both work.
  brand: {
    DEFAULT: withAlpha("--brand"),
    hover: withAlpha("--brand-hover"),
    ink: withAlpha("--brand-ink"),
    surface: withAlpha("--brand-surface"),
    line: withAlpha("--brand-line"),
  },
  // The landing-page drawing's blue, used as a support accent. Not merged into
  // `brand`: brand is the primary action and stays near-black.
  blueprint: {
    DEFAULT: withAlpha("--blueprint-solid"),
    ink: withAlpha("--blueprint-ink"),
    surface: withAlpha("--blueprint-surface"),
    line: withAlpha("--blueprint-line"),
  },
  verified: {
    DEFAULT: withAlpha("--verified"),
    surface: withAlpha("--verified-surface"),
    line: withAlpha("--verified-line"),
  },
  warn: {
    DEFAULT: withAlpha("--warn"),
    surface: withAlpha("--warn-surface"),
    line: withAlpha("--warn-line"),
  },
  alert: {
    DEFAULT: withAlpha("--alert"),
    surface: withAlpha("--alert-surface"),
    line: withAlpha("--alert-line"),
  },
  // Resolves against the nearest [data-category] ancestor — see main.scss.
  cat: {
    DEFAULT: withAlpha("--cat-solid"),
    ink: withAlpha("--cat-ink"),
    surface: withAlpha("--cat-surface"),
    line: withAlpha("--cat-line"),
  },
};

/** shadcn/ui primitives. These variables are aliases of the semantic set above,
 *  so the primitives inherit the app palette instead of drifting from it. */
const SHADCN_COLORS = {
  background: withAlpha("--background"),
  foreground: withAlpha("--foreground"),
  card: {
    DEFAULT: withAlpha("--card"),
    foreground: withAlpha("--card-foreground"),
  },
  popover: {
    DEFAULT: withAlpha("--popover"),
    foreground: withAlpha("--popover-foreground"),
  },
  primary: {
    DEFAULT: withAlpha("--primary"),
    foreground: withAlpha("--primary-foreground"),
  },
  secondary: {
    DEFAULT: withAlpha("--secondary"),
    foreground: withAlpha("--secondary-foreground"),
  },
  muted: {
    DEFAULT: withAlpha("--muted"),
    foreground: withAlpha("--muted-foreground"),
  },
  accent: {
    DEFAULT: withAlpha("--accent"),
    foreground: withAlpha("--accent-foreground"),
  },
  destructive: {
    DEFAULT: withAlpha("--destructive"),
    foreground: withAlpha("--destructive-foreground"),
  },
  border: withAlpha("--border"),
  input: withAlpha("--input"),
  ring: withAlpha("--ring"),
  chart: {
    1: withAlpha("--chart-1"),
    2: withAlpha("--chart-2"),
    3: withAlpha("--chart-3"),
    4: withAlpha("--chart-4"),
    5: withAlpha("--chart-5"),
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["class", "class"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    // Neue Haas Grotesk is the primary face. It ships in `src/assets/fonts/`,
    // it is the neo-grotesque lineage the reference site's Diatype descends
    // from, and it is that site's own declared fallback — so `sans` resolves to
    // it rather than to Inter, which was declared here but never loaded.
    fontFamily: {
      sans: ["grotesk", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      grotesk: ["grotesk", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
    },
    container: {
      center: "true",
      padding: {
        DEFAULT: "1rem",
      },
    },
    colors: {
      ...COLORS,
    },
    borderRadius: {
      ...BORDER_RADIUS,
    },
    boxShadow: {
      ...BOX_SHADOW,
    },
    screens: {
      ...BREAKPOINTS,
    },
    extend: {
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        bold: 700,
      },
      fontSize: {
        ...theme.FONT_SIZE,
      },
      lineHeight: {
        ...theme.LINE_HEIGHT,
      },
      // Display type gets negative tracking; -0.02em is the working default.
      letterSpacing: {
        snug: "-0.01em",
        tight: "-0.02em",
        tighter: "-0.03em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        ...SEMANTIC_COLORS,
        ...SHADCN_COLORS,
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
    require("tailwindcss-animate"),
  ],
};
