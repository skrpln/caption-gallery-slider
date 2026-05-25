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
- navigate with previous/next buttons, dots, and basic swipe gestures;
- render inline error states instead of throwing.

Captions, preview thumbnails, video controls, grid mode, and fullscreen are intentionally outside Phase 1.

## Modules

| Module | Responsibility |
| --- | --- |
| `src/parser/galleryBlockParser.ts` | Parses raw code block text into `GalleryConfig` and friendly validation errors. |
| `src/media/mediaTypes.ts` | Defines gallery media item types and Phase 1 supported media extensions. |
| `src/media/mediaResolver.ts` | Resolves vault-like entries into sorted `GalleryItem[]` without depending on Obsidian classes. |
| `src/media/obsidianVaultAdapter.ts` | Converts Obsidian `Vault`, `TFile`, and `TFolder` objects into the resolver's testable `VaultLike` shape. |
| `src/state/galleryState.ts` | Owns index transitions for next, previous, and direct navigation. |
| `src/render/GalleryRenderer.ts` | Creates the DOM widget and updates only media source and active navigation state. |
| `src/main.ts` | Registers the `gallery` code block processor and connects parser, resolver, and renderer. |

## Validation Rules

Phase 1 accepts:

- required `gallery_id`;
- at least one of `dir` or `list`;
- `sort: name | created | modified`;
- `height` as a positive number;
- `grid: 1,1`;
- `navigation: plane`.

Future options are parsed but rejected with inline messages when they are not part of Phase 1.

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

