# Keyboard Navigation

Related notes: [[plan]], [[documentation/phase-1-mvp]], [[documentation/architecture]], [[progress_log]]

## Status

Keyboard navigation with `ArrowLeft` and `ArrowRight` is implemented through a plugin-level active gallery target.

The behavior is scoped to the gallery widget:

- `ArrowRight` switches to the next media item;
- `ArrowLeft` switches to the previous media item;
- arrows work after pointer interaction inside the widget;
- arrows work while the pointer is inside any part of the widget, including viewport, navigation controls, video controls, and caption shell;
- arrows work while the widget root is fullscreen;
- clicking outside the widget disables the active state unless the widget is fullscreen;
- arrows are not captured while the caption body is being edited.

## Implementation

The renderer does not own global keyboard listeners. It only exposes the `GalleryKeyboardTarget` contract from `src/render/keyboardNavigation.ts`:

- `canHandleKeyboard()` returns whether this gallery can currently consume arrow keys;
- `nextFromKeyboard()` moves to the next item;
- `previousFromKeyboard()` moves to the previous item.

`src/main.ts` owns the active target:

- `activeGallery` stores the latest renderer that reported pointer or focus activity;
- one plugin-level `document` `keydown` listener handles `ArrowLeft` and `ArrowRight`;
- the listener asks `activeGallery.canHandleKeyboard()` before preventing default behavior;
- if the active renderer is stale or inactive, the listener clears `activeGallery`.

This follows the working model used by Media Slider: one active slider is stored at plugin level, and keyboard routing is centralized instead of distributed across renderer instances.

## Renderer Activation

`GalleryRenderer` calls `activateKeyboardTarget(this)` on:

- `focusin` inside the widget;
- `pointerenter` and `pointerover` on the root widget;
- `pointerdown` on the root widget;
- pointer interaction inside the viewport;
- entering fullscreen.

The active area is the whole widget, not only the viewport. This keeps arrow navigation active when the pointer is over previous/next buttons, top navigation, video controls, or the demonstration area.

## Cleanup

The plugin-level listener is registered through Obsidian `Plugin.registerDomEvent()`, so it is removed when the plugin unloads.

The active target is safe to keep as a reference because `canHandleKeyboard()` checks that the renderer root is still connected. If the renderer was unloaded, the next keydown clears the stale target.

## Tests

Unit coverage lives in `src/render/keyboardNavigation.test.ts` and verifies:

- active widgets capture arrows;
- hovered widgets capture arrows;
- fullscreen widgets capture arrows without prior activation;
- modified arrows are ignored;
- text editing keeps normal arrow behavior.
