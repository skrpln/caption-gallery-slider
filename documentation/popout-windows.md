# Popout Windows

Related notes: [[documentation/keyboard-navigation-backlog]], [[documentation/architecture]], [[documentation/release-pipeline]], [[progress_log]]

An Obsidian popout window is a separate browser window with its own `document`, `window`, and DOM classes. Two habits that work in the main window fail there:

- a listener on the global `document` never sees events from a popout;
- `node instanceof HTMLElement` is `false` for a node of a popout, because `HTMLElement` belongs to the main window.

`eslint-plugin-obsidianmd` reports both as `prefer-active-doc` and `prefer-instanceof`. Since `0.2.0` the plugin source has no such warnings.

## Rules in this codebase

| Need | Use | Not |
| --- | --- | --- |
| The document or window of a gallery | `el.doc`, `el.win` | `document`, `window` |
| Element an event started on | `event.targetNode` + `node.instanceOf(Element)` (`eventElement()` in the renderer) | `event.target instanceof HTMLElement` |
| Kind of a stored element | `this.mediaEl?.instanceOf(HTMLVideoElement)` | `this.mediaEl instanceof HTMLVideoElement` |
| Caret and selection | `contentEl.win.getSelection()`, `contentEl.doc.createRange()` | `window.getSelection()`, `document.createRange()` |
| Fullscreen state | `rootEl.doc.fullscreenElement`, `rootEl.doc.exitFullscreen()` | `document.fullscreenElement` |

`eventElement()` checks for `Element`, not `HTMLElement`, so an SVG icon inside a button also counts as the button for `closest(...)` checks.

## Document listeners are attached on first use

A gallery for a popout note may still belong to the main document while the renderer builds it, so a document listener added at render time can land in the wrong window. Both document listeners are therefore attached when the gallery is first used, to the document it is in at that moment, and at most once per document (a `WeakSet<Document>` remembers them):

- `src/main.ts` `listenForGalleryKeys(el.doc)` runs from `activateKeyboardTarget`, the callback every gallery calls on focus, pointer enter, and pointer down. It adds the capture `keydown` listener for arrows, WASD, and crop zoom.
- `src/render/GalleryRenderer.ts` `watchOutsidePointer(root)` runs from the same root events. It adds the `pointerdown` listener that deactivates the gallery on a press elsewhere in its window.

A gallery that moves to another window gets a listener in the new document on its next activation. Listeners are registered through `registerDomEvent`, so they are removed on plugin or renderer unload.

## Size observer, frames, and timers

The linter does not report these, but they are bound to a window as well:

- **`ResizeObserver`.** An observer belongs to the window that created it and reports during that window's paint. An observer of the main window watching a popout gallery stays silent while the main window does not repaint, for example when the popout covers it. The renderer had exactly this bug: a side caption measured as narrow while the popout was opening stayed at the bottom. `observeWidgetSize()` now creates the one size observer of the gallery with `root.win.ResizeObserver` and creates it again from `root.onWindowMigrated(...)` when the gallery moves to another window. The same observer drives the caption placement, the top navigation, the overlay controls, and the quarter-rotation box.
- **`requestAnimationFrame` and timers.** A covered main window counts as hidden, so its frames pause and its timers are throttled. The renderer uses `this.win` (the window of `containerEl`) for the caption typography frame, the crop long-press, persist, and cursor timers, and the auto-hiding tooltip timers.

`window.getComputedStyle` stays on the main window: it is synchronous and works for elements of any window.

## Checks

- Linter: 0 errors, 0 warnings with `eslint-plugin-obsidianmd` 0.5.1.
- Browser stand with the real renderer and a stub of the Obsidian cross-window helpers (`Node.doc`, `Node.win`, `Node.instanceOf`, `UIEvent.targetNode`): arrows, caption editing with the caret at the end, and deactivation on an outside click.
- Popout behavior itself is checked manually in Obsidian.
