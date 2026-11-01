---
name: Institutional Prediction Architecture
colors:
  surface: '#0a1420'
  surface-dim: '#0a1420'
  surface-bright: '#303a47'
  surface-container-lowest: '#050f1a'
  surface-container-low: '#121c28'
  surface-container: '#16202d'
  surface-container-high: '#212b37'
  surface-container-highest: '#2c3543'
  on-surface: '#d9e3f4'
  on-surface-variant: '#c2c6d7'
  inverse-surface: '#d9e3f4'
  inverse-on-surface: '#27313e'
  outline: '#8c90a0'
  outline-variant: '#424655'
  surface-tint: '#b1c5ff'
  primary: '#b1c5ff'
  on-primary: '#002c72'
  primary-container: '#5a8cff'
  on-primary-container: '#002664'
  inverse-primary: '#0056d0'
  secondary: '#ffb95e'
  on-secondary: '#472a00'
  secondary-container: '#a36701'
  on-secondary-container: '#fffbff'
  tertiary: '#50dcbc'
  on-tertiary: '#00382d'
  tertiary-container: '#00a388'
  on-tertiary-container: '#003027'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001847'
  on-primary-fixed-variant: '#0040a0'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95e'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#71f9d8'
  tertiary-fixed-dim: '#50dcbc'
  on-tertiary-fixed: '#002019'
  on-tertiary-fixed-variant: '#005142'
  background: '#0a1420'
  on-background: '#d9e3f4'
  surface-variant: '#2c3543'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
  data-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  data-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  micro:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers an institutional-grade, high-density prediction market terminal. The visual language conveys uncompromising execution speed, structural clarity, and mathematical rigor. Designed for professional market makers, quantitative analysts, and institutional traders, the aesthetic strips away ornamental fluff in favor of structural grid alignment, crisp hairline borders, and strict visual ergonomics.

Drawing from modern minimal fintech systems and high-throughput electronic trading desks, the interface treats information density as an asset. Micro-interactions are deliberate and razor-sharp. Elevation is structural rather than atmospheric, relying on muted slate borders and disciplined dark-tier layering to isolate live order books, probability vectors, and depth ladders.

## Colors

The palette establishes an absolute zero-ground workspace engineered for long-duration terminal viewing, precise data hierarchy, and instant cognitive parsing of risk metrics.

### System Palette Implementation
- **Canvas Base (`#000000`):** The absolute pitch foundation for all terminal frame roots, outer gutter lanes, and deep viewport areas.
- **Surface Panels (`#101014`):** The primary container level for market cards, trading modules, order books, and probability charts.
- **Interactive Elevated (`#131317` / `#1A1A22`):** Reserved for input fields, tab switches, dropdown trays, and hover states on panel surfaces.
- **Structural Hairstyle Borders (`#29313D`):** Delimits widget boundaries, internal data divisions, and table gridlines with a 1px baseline.
- **Brand Accent (`#3378FF`):** Electric Blue for active states, selected primary tabs, execution triggers, and system confirmation focus.
- **Hover Accent (`#EAA343`):** Warm Amber for cursor interactions, tertiary warning triggers, and interactive pricing focus.
- **Market State Polarity:**
  - **Positive / YES / Profit (`#16B89A`):** Muted Jade Green indicates appreciation, YES share buying, and bullish probability skew.
  - **Negative / NO / Loss (`#F05A70`):** Muted Coral Red indicates depreciation, NO share buying, and bearish probability skew.
- **Typographic Neutral Hierarchy:**
  - **Primary Text (`#F4F6FA`):** Maximum contrast for numeric values, active prices, and primary labels.
  - **Secondary Text (`#9BA5B5`):** Mid-tone for labels, chart axes, volume metrics, and metadata.

## Typography

The typography leverages Inter exclusively across all tiers. Because tabular data readability determines trading precision, numeric rendering across order books, pricing chips, and depth matrices enforces strict OpenType features: `font-feature-settings: "tnum" 1, "cv05" 1, "zero" 1` (tabular figures, l-variant, and slashed zero).

Headlines maintain tight tracking to maximize screen efficiency within dense market cards. Micro labels and metadata use uppercase styling with expanded tracking (`0.04em`) to ensure legibility when set against `#9BA5B5`. Body levels are tuned for compact multi-column reading without horizontal line collisions.

## Layout & Spacing

The layout model is governed by a strict 4px / 8px baseline grid organized around a 12-column high-throughput fluid chassis.

- **Desktop Layout:** A 12-column dynamic framework with persistent left market navigation (220px fixed), a central multi-viewport analytical pane (variable 6 to 8 columns), and an order execution/depth ladder rail (variable 3 to 4 columns or 360px fixed width).
- **Gutters & Dividers:** Columns are spaced using 12px (`0.75rem`) gutters on tablet and 16px (`1rem`) on desktop. In modular terminal viewports, negative space is minimized, substituting open gaps with 1px `#29313D` divider strokes.
- **Rhythm & Padding:** Component internal padding adheres to compact increments: 4px vertical by 8px horizontal for dense lists; 8px vertical by 12px horizontal for standard inputs and trading action bars.
- **Responsive Adaptability:** On mobile viewports (<768px), the layout compresses to a single-column stacked view with sticky bottom trading actions and horizontal snap rails for market metrics and probabilities.

## Elevation & Depth

This system intentionally eliminates atmospheric and diffused shadows. Depth is communicated strictly through surface layering and low-contrast outlines:

1. **Zero Base (`#000000`):** The bottom canvas layer housing terminal view framing.
2. **Surface Tier 01 (`#101014`):** Cards, market panels, chart viewports, and table containers, framed with a 1px border of `#29313D`.
3. **Surface Tier 02 (`#131317`):** Interactive inputs, nested row headers, unselected segment pills, and table hovering states.
4. **Surface Tier 03 (`#1A1A22`):** Elevated modals, dropdown menus, context menus, and floating toolbars, framed by `#29313D` with a subtle outline highlight (`box-shadow: 0 0 0 1px #3378FF` when focused).
5. **Chart Depth Overlays:** Probability curves utilize low-opacity vertical gradients beneath line strokes (e.g., `#16B89A` with 8% top opacity fading to 0% at the baseline).

## Shapes

The geometric framework uses controlled, soft edges that balance clean industrial lines with structural software ergonomics:

- **Baseline Components (Buttons, Chips, Inputs):** 4px (`0.25rem`) border radius, preserving sharp alignment while preventing visual abrasion at high densities.
- **Structural Containers (Market Cards, Modals):** 8px (`0.5rem`, `rounded-lg`) corner rounding to define major application sections without softening institutional weight.
- **Category Pill Tabs & Badges:** Compact 4px curvature or flat geometric rectangles with hairline division borders.
- **Indicator Dots:** Fully circular 6px to 8px discs for live execution and continuous trade pulse indicators.

## Components

### Trading Panel (Execution Desk)
- **Mode Toggle:** Segmented tab control with `#131317` background; active option uses `#101014` with a 1px border of `#3378FF` and `#F4F6FA` text.
- **Side Selection (YES / NO):**
  - **YES Action:** Surface `#101014`, active border and text `#16B89A`. When active, filled with `#16B89A` at 12% opacity.
  - **NO Action:** Surface `#101014`, active border and text `#F05A70`. When active, filled with `#F05A70` at 12% opacity.
- **Execution Button:** Primary `#3378FF` background with `#F4F6FA` bold text. Hover shifts to `#EAA343` with dark text (`#000000`) for explicit state confirmation before submission.

### Market Cards
- **Architecture:** `#101014` background encased in a 1px `#29313D` border.
- **Header:** Market title in `headline-md` (`#F4F6FA`), accompanied by a category badge and live volume ticker in `#9BA5B5`.
- **Price/Probability Tiles:** Split horizontal block showing YES and NO outcomes.
  - YES: Displays probability (e.g., "72%") and share price (e.g., "72¢") in `#16B89A`.
  - NO: Displays probability (e.g., "28%") and share price (e.g., "28¢") in `#F05A70`.
  - Hover on individual sides highlights with an inner `#131317` shift and a hairline accent border.

### Order Book & Depth Ladder
- **Display Mode:** Tabular numeric rendering (`tnum`) with alternating hairline separators.
- **Depth Rows:** Bid depth lines render a proportional horizontal background bar in `#16B89A` at 10% opacity; Ask depth lines render in `#F05A70` at 10% opacity.
- **Header Labels:** `label-caps` in `#9BA5B5` right-aligned for Size, Bid, and Ask.

### Probability Line Chart
- **Chassis:** Placed on `#101014` with a 1px border of `#29313D`.
- **Grid Lines:** Subtle `#1A1A22` horizontal and vertical reference lines.
- **Active Stroke:** Dynamic `#16B89A` or `#3378FF` stroke (2px thickness) with a crosshair cursor showing date and implied probability on hover.

### Inputs & Selectors
- **Field Anatomy:** Background `#131317`, border 1px `#29313D`, text `#F4F6FA`. Focused state displays border `#3378FF` without outer glow.
- **Denomination Affixes:** Embedded "USDC" or "¢" suffix tokens rendered in `#9BA5B5` with bold weight.

### Live Indicators & Badges
- **Live Pulse:** 6px green disc (`#16B89A`) with a subtle keyframe ripple indicating real-time websocket feed connectivity.
- **Category Chips:** Rectangular tags with 4px border radius, `#131317` surface, 1px `#29313D` border, and `#9BA5B5` text. Active tag toggles to `#3378FF` border and text.