# Widget Size Controls

Related notes: [[expectation]], [[documentation/phase-2-captions]], [[documentation/phase-3-top-navigation]], [[documentation/caption-placement]], [[progress_log]]

## Scope

The gallery widget exposes two direct resize handles:

- the media viewport handle changes `view_height`;
- the caption panel handle changes `caption_size`, the caption thickness: height for `top`/`bottom`, width for `left`/`right`.

With the default bottom caption the viewport handle is the top edge of the viewport and the caption handle is the bottom edge of the caption. The edges for the other placements are listed in [[documentation/caption-placement#Resize Handles]].

Handles update the widget size live during pointer drag: vertical handles use `ns-resize`, the side caption handle uses `ew-resize`. On pointer release the renderer asks the plugin entry layer to persist the new value in the source `gallery` code block.

## Source Update

`src/parser/galleryBlockEditor.ts` owns the source-text update helper. It is pure and covered by unit tests:

- existing `view_height` and `caption_size` lines are replaced in place;
- legacy `height` is renamed to `view_height` when the viewport is resized;
- legacy `caption_height` is renamed to `caption_size` when the caption is resized;
- missing size options are inserted near `gallery_id` or the existing height option;
- original line endings and final newline are preserved.

`src/main.ts` connects this helper to Obsidian. When an active editor for the current note is available, the code block body is updated through `Editor.replaceRange()`. Reading mode falls back to `Vault.process()` against `ctx.sourcePath`.

## Tooltip Policy

The media viewport and top navigation do not register Obsidian tooltips or tooltip-like item labels. This prevents hover labels from covering images, video, and preview thumbnails. Caption-related labels remain:

- caption panel: `caption`;
- caption note button: `caption note`.
