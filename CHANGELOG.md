# Changelog

## v4.0

Card frame removal and spirit chat entry restructure.

Included in this version:
- Removed all card frame structures (border, shadow, paper-panel) across the entire app to achieve a unified immersive game-style UI.
- Replaced bordered HUD badges on the home screen with translucent borderless overlays using backdrop-blur.
- Stripped card wrappers from GameOverlay back-button and title label; now translucent HUD-style floaters.
- Rebuilt SpiritHutOverlay without card panels; spirit displays directly on scene background with horizontal scrolling skin shelf using opacity/glow for selection state.
- Created SpiritChatOverlay as a dedicated spirit dialogue interface, replacing the old RadioChatOverlay; chat bubbles float directly on warm background without container card.
- Changed spirit scene item target from spiritHut to spiritChat — tapping the spirit in the shop now opens dialogue directly.
- Added "go to hut" secondary navigation inside SpiritChatOverlay for accessing the spirit hut from within chat.
- Rebuilt LogbookOverlay without card panels; journal entries use ruled-line background styling instead of bordered cards.
- Rebuilt MessageBoardOverlay with a dark blackboard background; sticky notes use colored fills and rotation with drop shadows instead of bordered cards.
- Removed card borders from GuestBookOpenView navigation buttons; now translucent HUD-style.
- Removed card border from RecipeBookOverlay page indicator.
- Updated PageTurnButton, SoftButton, and DemoControls to remove border and shadow styling.
- Updated CSS utility classes (paper-panel, paper-dashed, paper-label) to remove borders and shadows.
- Updated App.tsx view system to wire spiritChat view and remove radioChat references.

## v3.3

Guest book presentation polish.

Included in this version:
- Rebuilt the guest-book confirm view into a full-screen dimmed scene with a floating cover and text-only yes/no choices.
- Rebuilt the open guest-book view into a single animated book presentation with synchronized page, avatar, name, and text reveal.
- Added the TianRanDai font for the guest-book confirm and open flows.
- Unified the guest mapping data and aligned the orange cat asset with its displayed guest profile.
- Removed the extra center button from the open view and switched prev/next paging to wrap cyclically.

## v3.2

Guest book interaction flow rebuild.

Included in this version:
- Added a dedicated guest book confirm scene before opening the guest archive.
- Rebuilt the guest book open view around the provided inner-page template and single-guest paging flow.
- Switched app-level navigation to explicit guest book states instead of opening the archive directly from the home scene.
- Added guest book scene-entry and page-open animations with dimmed shop-scene backgrounds.

## v3.1

Spirit base art replacement.

Included in this version:
- Replaced the default dough spirit and xiaolongbao skin with the newly cut-out PNG versions.
- Updated asset sync logic to prefer canonical asset filenames already placed in `public/assets`, so future `prepare-assets` runs do not overwrite these replacements with older source images.

## v3.0

Full-screen scene app rebuild.

Included in this version:
- Rebuilt the home screen into a true full-screen shop scene without the previous outer card shell or large section blocks.
- Replaced text hotspot entry areas with positioned PNG scene items for the recipe book, guest book, radio, and spirit.
- Added a centralized `sceneItems` configuration and a new scene item button interaction with tap glow and delayed open.
- Rebuilt the recipe book as a full-screen inner-book template with absolutely positioned dish content overlays.
- Rebuilt the guest book into a cover page plus single-guest inner pages using the provided guest-book template instead of a grid.
- Converted item pages from card-like overlays into full-screen game-style views with lightweight page transitions.

## v2.1

GitHub Pages asset path fix.

Included in this version:
- Fixed all image asset URLs to respect the Vite `BASE_URL` instead of hardcoding `/assets/...`.
- Restored image loading on the deployed GitHub Pages site under `/jinwanzaodian/`.

## v2.0

Image-driven interactive scene rebuild.

Included in this version:
- Added asset sync and trim pipeline for the new source image set.
- Rebuilt the home screen into a clickable shop scene with interactive hotspots.
- Replaced section-style pages with game overlays for recipes, guest book, guest detail, spirit hut, radio chat, logbook, and message board.
- Switched asset usage to centralized English-named paths with trimmed fallback handling.
- Updated the demo data to use the new food, guest, and spirit image assets.

## v1.2

Single-screen app prototype restructure.

Included in this version:
- Rebuilt onboarding as a step-by-step page flow.
- Converted the home screen into a single-screen shop view with four main app entrances.
- Reworked the menu into a paged recipe book.
- Reworked the guest book into a collectible grid with a guest detail page.
- Reworked the logbook into paged handwritten records.
- Added a fixed-response spirit chat page with chat bubbles and quick replies.
- Split scene and character image rendering rules in `AssetImage`.
- Added trimmed asset lookup for character PNG files with fallback to original assets.
- Added `scripts/trim-transparent-assets.mjs` and `npm run trim-assets`.

## v1.1

GitHub Pages deployment setup.

Included in this version:
- Added a GitHub Actions workflow to build and deploy the Vite app to GitHub Pages.
- Updated the Vite base path for the `sunnywang666/jinwanzaodian` repository deployment.
- Bumped the project version from `1.0.0` to `1.1.0`.

## v1.0

Initial demo release.

Included in this version:
- Initialized the project with React + Vite + TypeScript + Tailwind CSS.
- Reorganized the source documents into `docs/product-concept-v5.md` and `docs/ui-spec-v5.md`.
- Mapped the existing image assets into `public/assets/`.
- Built the mobile-first app shell and bottom navigation.
- Implemented `AssetImage` with a unified missing-asset placeholder card.
- Implemented the core demo pages:
  - Home
  - Onboarding
  - Menu
  - GuestBook
  - Logbook
  - SpiritHut
  - EveningPrepare
  - NightClosing
- Added localStorage persistence for onboarding, spirit form, lights-off time, demo scene, and closing state.
- Verified the project with `npm run build`.

## Versioning rule

- Small change: `v1.1`, `v1.2`, `v1.3`...
- Large change: `v2.0`, `v3.0`...
- Package version uses semver format alongside the display version:
  - `v1.0` => `1.0.0`
  - `v1.1` => `1.1.0`
  - `v2.0` => `2.0.0`
