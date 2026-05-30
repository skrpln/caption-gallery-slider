# Widget Size Controls

Related notes: [[expectation]], [[documentation/phase-2-captions]], [[documentation/phase-3-top-navigation]], [[progress_log]]

## Scope

The gallery widget exposes two direct resize handles:

- the top edge of the media viewport changes `view_height`;
- the bottom edge of the caption panel changes `caption_height`.

Both handles use the vertical resize cursor and update the widget size live during pointer drag. On pointer release the renderer asks the plugin entry layer to persist the new value in the source `gallery` code block.

## Source Update

`src/parser/galleryBlockEditor.ts` owns the source-text update helper. It is pure and covered by unit tests:

- existing `view_height` and `caption_height` lines are replaced in place;
- legacy `height` is renamed to `view_height` when the viewport is resized;
- missing size options are inserted near `gallery_id` or the existing height option;
- original line endings and final newline are preserved.

`src/main.ts` connects this helper to Obsidian. When an active editor for the current note is available, the code block body is updated through `Editor.replaceRange()`. Reading mode falls back to `Vault.process()` against `ctx.sourcePath`.

## Tooltip Policy

The media viewport and top navigation do not register Obsidian tooltips or tooltip-like item labels. This prevents hover labels from covering images, video, and preview thumbnails. Caption-related labels remain:

- caption panel: `caption`;
- caption note button: `caption note`.
