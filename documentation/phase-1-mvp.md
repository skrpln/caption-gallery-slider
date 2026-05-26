# Phase 1 MVP

Related notes: [[plan]], [[documentation/architecture]], [[progress_log]]

## Scope

Phase 1 implements the first usable `gallery` code block:

- parse and validate `gallery` block parameters;
- resolve image files from `dir` and `list`;
- recursively scan nested folders inside `dir`;
- merge `dir` and `list` into one deduplicated set;
- sort the full set by `name`, `created`, or `modified`;
- render a single-image viewport for `grid: 1,1`;
- navigate with previous/next buttons, dots, basic swipe gestures, and wheel/trackpad input after the viewport is focused;
- set media viewport height with `view_height`;
- switch image sizing with `view: crop | fit`;
- expose a native fullscreen button for the current gallery widget;
- render inline error states instead of throwing.

Caption rendering/editing, preview thumbnails, video controls, and grid mode are intentionally outside Phase 1.

## Modules

| Module                              | Responsibility                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/parser/galleryBlockParser.ts`  | Parses raw code block text into `GalleryConfig` and friendly validation errors.                           |
| `src/media/mediaTypes.ts`           | Defines gallery media item types and Phase 1 supported media extensions.                                  |
| `src/media/mediaResolver.ts`        | Resolves vault-like entries into sorted `GalleryItem[]` without depending on Obsidian classes.            |
| `src/media/obsidianVaultAdapter.ts` | Converts Obsidian `Vault`, `TFile`, and `TFolder` objects into the resolver's testable `VaultLike` shape. |
| `src/state/galleryState.ts`         | Owns index transitions for next, previous, and direct navigation.                                         |
| `src/render/GalleryRenderer.ts`     | Creates the DOM widget and updates only media source and active navigation state.                         |
| `src/main.ts`                       | Registers the `gallery` code block processor and connects parser, resolver, and renderer.                 |

## Validation Rules

Phase 1 accepts:

- required `gallery_id`;
- at least one of `dir` or `list`;
- `sort: name | created | modified`;
- `view_height` as a positive number;
- `caption_height` as a positive number;
- `grid: 1,1`;
- `navigation: plain`;
- `view: crop | fit`;
- `caption: true | false`.

Future options are parsed but rejected with inline messages when they are not part of Phase 1.

`view_height` defaults to `400`. `caption_height` defaults to `60`. The legacy `height` option is temporarily mapped to `view_height`.

`view: crop` is the default and crops media to fill the viewport. `view: fit` keeps the whole image visible inside the viewport and may leave empty space near the edges. Scalar option values are normalized for case, quote characters, trailing punctuation, and common Cyrillic/Latin lookalikes. `caption` now defaults to `true`; `caption: false` keeps the compact gallery without a caption panel.

## Interaction

The viewport receives focus after a click inside the gallery image area. While focused:

- horizontal trackpad scroll or mouse wheel moves to the next/previous image;

Keyboard arrow navigation was tested in this session but deferred to Phase 6 accessibility work because it did not behave reliably in Obsidian Reading/Live Preview contexts. Details and tested approaches are documented in [[documentation/keyboard-navigation-backlog]].

Previous/next controls live in a full-width strip under the viewport, split into two half-width buttons. Each button uses three chevron icons and the same translucent theme-aware styling without covering the image. The fullscreen control is a small macOS-style circular button aligned with the navigation row.

## Sorting and Deduplication

`dir` and `list` are treated as one media set:

1. Recursively collect files from `dir`.
2. Add explicit `list` files.
3. Deduplicate by vault path.
4. Filter to Phase 1 image extensions.
5. Sort the full result by the configured `sort` mode.

## Cleanup

`GalleryRenderer` extends `MarkdownRenderChild` and is registered through the markdown post processor context. DOM event listeners are registered with `registerDomEvent`, so Obsidian can clean them up when the rendered block is unloaded.

## Tests

Current unit coverage:

- parser success and validation failures;
- recursive media resolution;
- unified sorting for `dir + list`;
- deduplication;
- missing path errors;
- gallery state wrap-around and clamping.

Last verified commands:

```bash
npm test
npm run build
```
