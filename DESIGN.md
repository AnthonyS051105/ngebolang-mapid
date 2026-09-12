# Design

## Visual Theme

Light, clean, map-first UI. White floating cards/panels over a desaturated MapLibre basemap. Rounded-but-restrained corners (12–20px), soft layered shadows for elevation (not borders), generous internal padding. Dark sidebar (near-black `#12151c`) is the one deliberate contrast surface against an otherwise light, airy interface — it anchors navigation without competing with map content.

## Color

Defined as CSS custom properties in `app/globals.css` (`:root`). Light theme only currently (no dark-mode media query).

```
--sidebar-bg: #12151c        /* dark sidebar surface */
--sidebar-bg-2: #171b24
--sidebar-border: #232733
--sidebar-text: #8b93a7       /* sidebar body text on dark */
--sidebar-text-dim: #5b6376   /* sidebar secondary/dim text */
--green: #2563eb              /* primary accent (blue, named "green" historically) */
--green-dark: #1d4ed8         /* primary hover/active */
--green-light: #e8f0fe        /* primary tint background */
--red: #ef4444                /* Jalan Rusak / error */
--orange: #f5820a             /* Macet / warning */
--blue: #2f7cf6                /* Halte Penuh / info */
--purple: #9b5cf5              /* Trotoar Terhalang */
--gray: #6b7280                /* Info Lainnya / neutral */
--ink: #161a22                 /* primary body text (light surfaces) */
--card-border: #e8eaee         /* hairline borders on white cards */
--page-bg: #eef1f4             /* app background behind panels */
```

Note: the primary accent variable is literally named `--green` but its value is blue (`#2563eb`) — a historical mismatch worth fixing if the token is ever renamed, but functionally it is the app's single primary accent color used for CTAs, active states, and links.

Category colors (report types) are hardcoded per-category in `lib/data.ts` (`CAT`), not CSS variables: Macet `#f5820a`, Banjir/Genangan `#2f7cf6`, Jalan Rusak `#ef4444`, Parkir Liar `#9b5cf5`, Pasar Tumpah/Event `#22c55e`, Lainnya `#6b7280`.

## Typography

Single font family: Plus Jakarta Sans (`--font-plus-jakarta-sans`, loaded via `next/font/google` in `app/layout.tsx`), falling back to `system-ui, sans-serif`. No secondary/serif pairing — weight and size carry all hierarchy.

Scale in use (approximate, from `globals.css`):
- Section labels / eyebrows: 10.5–11px, weight 800, uppercase, letter-spacing 0.02–0.06em (e.g. `.side-title`, `.pref-panel-label`)
- Body / UI text: 12–13px, weight 500–700
- Card titles / emphasis: 13.5–15px, weight 700–800
- Panel headings (`.rp-header h2`, `.chat-panel-header h2`): 15px, weight 800
- Numeric/stat values (`.stat-box .val`): 15px, weight 800

No display/hero type — this is a product UI, not a marketing surface, so the scale stays compressed and functional throughout.

## Spacing & Layout

- Desktop: fixed 3-column CSS Grid (`grid-template-columns: 248px 1fr 356px`) — dark icon+label sidebar, map area (flex-fill), white AI Trip Planner panel.
- Tablet (601–1023px): sidebar collapses to a 76px icon-only rail; right panel narrows to 300px; map overlay chrome (search bar, layer card, zoom cluster) repositioned to avoid collision in the narrower map column.
- Mobile (≤600px): single-column full-screen map with a bottom tab bar (Peta / FAB / Feed), a draggable bottom sheet for Feed Threads, and a full-screen overlay for the AI Trip Planner chat. Sidebar and the persistent right panel are not used at this size.
- Floating map overlays (search bar, layer card, zoom controls, feed panel) are `position: absolute` over the map, not part of document flow — spacing between them is manually offset (`top`/`bottom` px values), which is fragile across breakpoints and the main source of past overlap bugs; any new floating element must be checked against siblings at all three breakpoints.
- Border radius: 10–16px on cards/buttons/inputs, up to 18–20px on large sheets/modals, full pill (`border-radius: 50%` or `20px+` on small elements) for badges/switches/avatars.

## Components

- **Cards** (`.fcard`, `.stat-box`, `.info-cell`, `.step`): white or `#f7f8fa` fill, no border in most cases, shadow only on interactive/hoverable cards (`.fcard:hover`). Nested-card patterns are avoided (route steps are list rows, not cards-in-cards).
- **Buttons**: `.btn-primary` (solid accent, white text), `.btn-outline` (white fill, bordered), `.plan-btn` (accent, pill-ish, icon+label). All buttons currently lack hover/active feedback beyond a background color swap — no scale, shadow-lift, or transition polish yet.
- **Pills/badges**: `.pill`, `.tab`, `.eff-pill`, `.status-pill` — small rounded-rect or full-pill labels, colored by semantic state (category color, status tone).
- **Modals**: `.overlay-backdrop` + `.overlay-panel`, centered on desktop/tablet, becomes a bottom sheet (`border-radius: 20px 20px 0 0`, slides from bottom) on mobile.
- **Floating panels**: `.layer-card`, `.basemap-pill`, `.feed-panel`, `.poi-popup` — absolutely positioned over the map, always-open by default (no minimize/collapse affordance yet outside the mobile Feed bottom-sheet drag handle).
- **Icons**: `lucide-react`, sized 12–22px depending on context, colored via `svg.lucide` override rules keyed by parent class.

## Motion

Minimal and functional only: `transition: 0.15s` on hover states (nav items, cards), a `cubic-bezier(0.22, 1, 0.36, 1)` slide for the mobile bottom sheet, a `pref-refetch-pulse` opacity pulse for the "updating route" indicator. No `prefers-reduced-motion` guards currently defined — should be added alongside any new animation work per PRODUCT.md accessibility principles.

## Known gaps (as of this document)

- Several visible controls have no wired behavior yet (weather pill, basemap switcher, notification bell, avatar/profile menu, "Lihat semua", sort dropdown, photo upload in report composer, share-route button) — see audit findings in project conversation history for the full file:line list.
- No dark mode.
- No global custom scrollbar hiding (native scrollbars currently visible on horizontal card rails and modal overflow).
- Sidebar collapse is a text-label toggle at the bottom of the dark sidebar, not a top-corner icon affordance.
