# Phase 3 Top Navigation

Related notes: [[plan]], [[expectation]], [[documentation/architecture]], [[documentation/phase-2-captions]], [[progress_log]]

## Scope

Phase 3 completes the gallery top navigation for the current `grid: 1,1` renderer:

- `navigation: plain` uses dots for up to `10` items;
- `navigation: plain` switches to a rail when there are more than `10` items or the dots do not fit the viewport width;
- `navigation: preview` renders a horizontal thumbnail strip inside the viewport;
- clicking any dot, rail position, or thumbnail moves to the matching media item.

`grid != 1,1` remains a Phase 5 feature. The parser still rejects non-single-cell grids.

## Navigation Layout

`src/render/navigationLayout.ts` owns the pure layout decisions:

- `choosePlainNavigationLayout()` returns `dots` or `rail` from item count and available width;
- `chooseTopNavigationLayout()` keeps `preview` explicit and delegates `plain` to the adaptive helper;
- `navigationPointerToIndex()` maps a rail pointer offset to the nearest item index with clamping.

The renderer keeps only DOM responsibilities: creating buttons, updating active state, and applying the selected CSS class.

## Preview Thumbnails

Preview thumbnails are rendered as square buttons with the same visual scale as the compact gallery controls. The strip is constrained by the viewport width and scrolls horizontally when the media set is longer than the visible area.

Image and video thumbnails reuse Obsidian resource URLs through the same `getResourcePath()` adapter as the main viewport. Video thumbnails render a metadata-preloaded `<video>` preview with a centered play marker.

## Tooltip Lifetime

Obsidian shows tooltips from control labels. Gallery controls and labeled gallery regions keep their accessible label at rest, but while hovered or focused the label is removed after `5` seconds and restored on mouse leave or blur. This prevents persistent tooltips from covering media and captions during inspection.

`src/render/autoHidingTooltip.ts` owns this lifecycle so every tooltip-like label follows the same timeout and cleanup path. The renderer also registers Obsidian-native tooltips with the `og-gallery__tooltip` class; CSS fades that tooltip popover after the same `5` second lifetime, and the timeout removes matching visible tooltip nodes as a fallback for already-open popovers.

## Rotation and View Modes

The viewport now clips media explicitly and positions the main image from its center. For `90` and `270` degree rotations the renderer swaps the media element box to the viewport height/width before applying the transform.

This keeps `view: crop` consistent after rotation: the rotated media still fills the viewport and is clipped by the viewport boundary instead of appearing like `view: fit`.

## Tests

Phase 3 expands unit coverage for:

- plain dots/rail threshold;
- top navigation mode selection;
- rail pointer-to-index mapping;
- auto-hiding tooltip labels;
- parser support for `navigation: preview`.
