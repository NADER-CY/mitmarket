# ATLAS React workspace — live data preview

This is the first verified React + TypeScript + Vite project shell for the 74 supplied ATLAS Stitch designs.

## Current implementation

- All 37 desktop and 37 mobile reference HTML documents and PNGs are preserved in `public/stitch/`.
- React Router navigation covers every distinct screen.
- Desktop/mobile reference switching works for every route.
- An isolated iframe displays each original Stitch HTML document without altering its styling.
- Original Stitch screens now fill the viewport; the screen picker and live feed can be opened from a floating toolbar.
- Public Gamma API loads a set of active Polymarket events and the public CLOB market WebSocket streams price updates for the selected market tokens, with heartbeat and reconnection.
- A 29-language selection is persisted locally. The preview controls have localized labels, and right-to-left direction is used for Persian, Arabic, Hebrew and Urdu.
- The owner-approved Stitch visual layout is preserved for **all** pages. React injects market titles, probabilities and selected metadata into existing home and Explore elements without restructuring their cards and tables.
- Existing category links navigate to the original Explore template with Gamma tag filters; clicking a populated market opens the original binary-market template and updates its existing SVG probability chart from the public CLOB `/prices-history` API.
- The owner-approved palette is mechanically applied to all 74 Stitch HTML reference files (colors only): black canvas, #101014 panels/charts, #131317 elevations, #3378FF blue, #EAA343 hover, #16B89A positive and #F05A70 negative. The original layout is not rewritten.

## Not yet implemented

The reference screens are **not native React screen components**. Some non-market illustrative figures remain static and **are not** synchronized with the live feed. Category discovery is limited to the first 100 events per category and at most 240 market contracts per response; live WebSocket subscriptions cover a bounded subset. Market descriptions are not translated, and complete translation of all Stitch pages is not implemented. Real shared account components, trading, authentication, wallet flows, and backend services are subsequent migration tasks. No financial operation is wired or enabled. No private Polymarket API credentials are needed for the public feed.

## Run

```bash
npm install
npm run dev
```

Then open `/preview/home`. Build with `npm run build`.

## Source of truth

The original Stitch HTML/CSS, assets, and design tokens remain unmodified. During subsequent migration, compare native React components against those references before replacing the iframe views.
