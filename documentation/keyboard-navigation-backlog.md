# Keyboard Navigation Backlog

Related notes: [[plan]], [[documentation/phase-1-mvp]], [[documentation/architecture]], [[progress_log]]

## Status

Keyboard navigation with `ArrowLeft` and `ArrowRight` is deferred to Phase 6 accessibility work.

The feature is desirable but not blocking for Phase 1 polishing. Buttons, dots, swipe gestures, wheel/trackpad navigation, and fullscreen are enough for the current accepted slider experience.

## Expected Behavior

After the user clicks inside the gallery viewport:

- `ArrowRight` should switch to the next image;
- `ArrowLeft` should switch to the previous image;
- navigation should remain scoped to the active gallery;
- clicking outside the gallery should disable the gallery key handling;
- future caption editors must keep normal arrow behavior for cursor movement.

## Tested Approaches

### Focused viewport DOM listener

Implementation idea:

- make `.og-gallery__viewport` focusable with `tabIndex = 0`;
- call `viewportEl.focus()` after click/pointer interaction;
- listen for `keydown` on the viewport;
- ignore editable descendants with `input`, `textarea`, `select`, and `contenteditable` checks.

Result:

- did not trigger reliably in Obsidian after clicking the rendered code block;
- likely reason: focus remains owned by Obsidian Reading/Live Preview/editor infrastructure, or keyboard events are handled before reaching the custom DOM node.

### Document-level DOM listener

Implementation idea:

- register `keydown` on `document`;
- keep an internal boolean that marks the gallery as active after a click inside its root;
- call `preventDefault()` for `ArrowLeft` and `ArrowRight`;
- disable the flag after pointer interaction outside the gallery.

Result:

- still did not work reliably during manual testing;
- likely reason: Obsidian's active editor/view key handling can consume or redirect arrow-key behavior before the plugin's document listener handles it in the expected context.

### Window capture listener

Implementation idea:

- register `keydown` on `window` with `{ capture: true }`;
- activate it only after clicking inside the gallery;
- stop propagation and prevent default for arrow keys.

Result:

- did not solve the issue in the tested Obsidian context;
- this approach is also more invasive because it observes global keydown events and may conflict with Obsidian scopes or other plugins if not handled very carefully.

### Obsidian `Scope`

Implementation idea:

- create `new Scope(app.scope)`;
- register `ArrowLeft` and `ArrowRight` with `scope.register([], key, handler)`;
- call `app.keymap.pushScope(scope)` when the gallery becomes active;
- call `app.keymap.popScope(scope)` when focus leaves the gallery or the renderer unloads.

Result:

- compiled successfully and matches Obsidian's public keymap API;
- manual testing still did not produce reliable arrow navigation in the current renderer context;
- the temporary implementation was removed from runtime to avoid false behavior and possible interference with Obsidian keymap handling.

## Current Decision

Do not ship keyboard arrow navigation in Phase 1.

The Phase 1 renderer keeps:

- click navigation through the bottom previous/next strip;
- dots navigation;
- horizontal wheel/trackpad navigation after gallery activation;
- pointer swipe gestures;
- fullscreen toggle.

Keyboard arrows remain a backlog item for the Phase 6 accessibility pass.

## Recommended Next Investigation

For Phase 6:

- test in both Reading mode and Live Preview separately;
- check whether `ctx` or surrounding markdown view exposes a view/component scope that should be used instead of `app.scope`;
- test Obsidian `Scope` behavior in a minimal plugin command/view before reintroducing it into the gallery renderer;
- inspect whether CodeMirror active editor focus in Live Preview consumes arrow keys before plugin scopes;
- add a small debug-only notice/log path that confirms whether `Scope.register()` handlers fire;
- consider using explicit focusable controls or a dedicated active-view mechanism if global scopes remain unreliable.

## Acceptance Criteria For Revisit

- arrow navigation works after clicking the gallery in Reading mode;
- arrow navigation works after clicking the gallery in Live Preview;
- clicking outside the gallery restores normal Obsidian arrow behavior;
- arrow keys do not navigate the gallery while editing future caption text;
- cleanup removes all key handlers/scopes when the markdown block unloads.
