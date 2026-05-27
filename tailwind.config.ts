import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			/* ── COLORS (from tokens.css) ── */
			colors: {
				// Brand
				brand: {
					DEFAULT: "var(--color-brand)",
					hover: "var(--color-brand-hover)",
					light: "var(--color-brand-light)",
				},

				// Alias for the brand red. Used as `bg-uno-red`, `text-uno-red`,
				// `bg-uno-red-hover` across admin + agent consoles. Kept here
				// (not in tokens.css) so changing the brand colour in one place
				// (--color-brand) cascades to every uno-red utility.
				"uno-red": {
					DEFAULT: "var(--color-brand)",
					hover: "var(--color-brand-hover)",
				},

				// Content text aliases used by admin/agent shells. These map to
				// the existing text tokens so we don't have to refactor every
				// "text-content-primary" call site.
				"content-primary": "var(--text-primary)",
				"content-secondary": "var(--text-secondary)",

				// Actions
				action: {
					primary: "var(--action-primary)",
					"primary-hover": "var(--action-primary-hover)",
					secondary: "var(--action-secondary)",
					"secondary-hover": "var(--action-secondary-hover)",
					disabled: "var(--action-disabled)",
				},

				// Text
				text: {
					primary: "var(--text-primary)",
					secondary: "var(--text-secondary)",
					muted: "var(--text-muted)",
					inverse: "var(--text-inverse)",
					brand: "var(--text-brand)",
					link: "var(--text-link)",
				},

				// Backgrounds
				bg: {
					page: "var(--bg-page)",
					card: "var(--bg-card)",
					subtle: "var(--bg-subtle)",
					muted: "var(--bg-muted)",
					overlay: "var(--bg-overlay)",
					brand: "var(--bg-brand)",
				},

				// Borders
				"border-color": {
					DEFAULT: "var(--border-default)",
					strong: "var(--border-strong)",
					brand: "var(--border-brand)",
					focus: "var(--border-focus)",
				},

				// Status
				status: {
					success: {
						DEFAULT: "var(--status-success-text)",
						bg: "var(--status-success-bg)",
						border: "var(--status-success-border)",
					},
					info: {
						DEFAULT: "var(--status-info-text)",
						bg: "var(--status-info-bg)",
						border: "var(--status-info-border)",
					},
					warning: {
						DEFAULT: "var(--status-warning-text)",
						bg: "var(--status-warning-bg)",
						border: "var(--status-warning-border)",
					},
					error: {
						DEFAULT: "var(--status-error-text)",
						bg: "var(--status-error-bg)",
						border: "var(--status-error-border)",
					},
				},

				// shadcn/ui tokens (keep for compatibility)
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},

			/* ── TYPOGRAPHY ── */
			fontFamily: {
				sans: ["var(--font-family)"],
			},
			fontSize: {
				h1: ["var(--font-size-h1)", { lineHeight: "var(--line-height-h1)", fontWeight: "var(--font-weight-semibold)" }],
				h2: ["var(--font-size-h2)", { lineHeight: "var(--line-height-h2)", fontWeight: "var(--font-weight-semibold)" }],
				h3: ["var(--font-size-h3)", { lineHeight: "var(--line-height-h3)", fontWeight: "var(--font-weight-semibold)" }],
				body: ["var(--font-size-body)", { lineHeight: "var(--line-height-body)", fontWeight: "var(--font-weight-regular)" }],
				small: ["var(--font-size-small)", { lineHeight: "var(--line-height-small)", fontWeight: "var(--font-weight-regular)" }],
				caption: ["var(--font-size-caption)", { lineHeight: "var(--line-height-caption)", fontWeight: "var(--font-weight-regular)" }],
				tiny: ["var(--font-size-tiny)", { lineHeight: "var(--line-height-caption)", fontWeight: "var(--font-weight-regular)" }],
			},

			/* ── SPACING ── */
			spacing: {
				tight: "var(--spacing-tight)",
				base: "var(--spacing-base)",
				comfortable: "var(--spacing-comfortable)",
				spacious: "var(--spacing-spacious)",
				loose: "var(--spacing-loose)",
				"page-mobile": "var(--spacing-page-mobile)",
				"page-desktop": "var(--spacing-page-desktop)",
				section: "var(--spacing-section)",
			},

			/* ── BORDER RADIUS ── */
			borderRadius: {
				"card-sm": "var(--radius-card-sm)",
				"card-lg": "var(--radius-card-lg)",
				tag: "var(--radius-tag)",
				"input-sm": "var(--radius-input-sm)",
				"input-lg": "var(--radius-input-lg)",
				button: "var(--radius-button)",
				full: "var(--radius-full)",
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},

			/* ── MIN HEIGHTS ── */
			minHeight: {
				touch: "var(--min-h-touch)",
				button: "var(--min-h-button)",
				input: "var(--min-h-input)",
			},

			/* ── SHADOWS ── */
			boxShadow: {
				card: "var(--shadow-card)",
				"card-hover": "var(--shadow-card-hover)",
				modal: "var(--shadow-modal)",
			},

			/* ── BREAKPOINTS ── */
			screens: {
				xs: "375px",
				sm: "430px",
				md: "768px",
				lg: "1024px",
				xl: "1280px",
			},

			/* ── ANIMATIONS ── */
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"slide-up": {
					from: { transform: "translateY(100%)" },
					to: { transform: "translateY(0)" },
				},
				"fade-in": {
					from: { opacity: "0" },
					to: { opacity: "1" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"slide-up": "slide-up 0.3s ease-out",
				"fade-in": "fade-in 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
};

export default config;
