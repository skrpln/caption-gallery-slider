# Phase 2 Captions

Related notes: [[plan]], [[expectation]], [[documentation/architecture]], [[progress_log]]

## Current Scope

Phase 2 starts the caption system with these implemented pieces:

- plugin settings expose a `Caption folder` field with folder suggestions;
- `gallery_captions` is shown as an example placeholder, not saved automatically;
- missing caption folders are created when the user commits the setting;
- the gallery renderer reserves a caption panel directly under previous/next controls;
- captions are created lazily when the user types the first character;
- existing caption files render as Markdown through `MarkdownRenderer.render()`;
- internal links in rendered captions receive explicit click and hover handlers.
- media rotation is stored in caption note frontmatter as `rotation`.

Video-specific frontmatter playback settings remain a later Phase 4 step.

## Settings

`src/settings/settings.ts` owns pure settings data and normalization. It has no Obsidian runtime imports so it can be covered by unit tests. The stored default is intentionally empty: the user must choose a caption storage folder.

`src/settings/ObsidianGallerySettingTab.ts` owns the Obsidian settings UI. The text field shows `Example: gallery_captions` as placeholder and suggests existing vault folders while typing. The committed value is normalized as a vault-relative folder path:

- trims whitespace;
- converts backslashes to slashes;
- removes leading and trailing slashes;
- collapses repeated slashes;
- keeps an empty value when the user clears the field.

When a non-empty folder is committed by blur, Enter, or selecting a suggestion, the plugin creates missing folder segments immediately.

## Caption Paths

`src/captions/captionPath.ts` builds deterministic caption note paths:

```text
{gallery_save_dir}/{gallery_id}/{target_type}-{short_hash}.md
```

The current target prefixes are:

- `img` for images;
- `vid` for future video captions.

The short hash is deterministic and based on the media vault path. `gallery_id` remains part of the path, so the same media file can have different captions in different galleries.

Hash algorithm:

1. Start with the 32-bit FNV-1a offset value `0x811c9dc5`.
2. For each UTF-16 code unit in the vault path, XOR the hash with the code unit.
3. Multiply by the FNV prime `0x01000193` with 32-bit overflow.
4. Convert the unsigned 32-bit result to base36.
5. Pad and trim the result to 7 characters.

The hash is not cryptographic. It is a short stable filename key for Obsidian vault paths.

## Caption Panel

The caption panel is rendered only when `caption` is enabled. In Phase 2 the parser default is now `caption: true`; `caption: false` still hides the panel for compact galleries.

Layout:

- position: directly below the previous/next button strip;
- width: full gallery width;
- height: controlled by `caption_height`, default `60px`;
- shape: theme-aware rounded rectangle;
- empty state with configured storage: italic `insert caption` placeholder;
- empty state without configured storage: italic setup hint and inactive editor.

Clicking a configured empty caption panel clears the placeholder and focuses a contenteditable Markdown editor. The caption note is created only after the first non-empty input. After blur, the saved body is rendered as Markdown again.

A caption note button lives in the top-right corner of the caption panel. It is hidden by default and appears on caption hover/focus. It opens the corresponding caption note in the main Obsidian workspace; clicking it may create an empty caption note.

Caption text uses a compact `1.15` line height and minimal top padding so the fixed caption area holds more Markdown content before scrolling. The rendered Markdown view uses `white-space: normal`, while inline editing uses `white-space: pre-wrap`; this prevents renderer-created whitespace nodes from becoming visual blank lines in preview mode. The renderer explicitly marks the caption content as `.markdown-rendered`, and then compacts Obsidian Markdown block wrappers such as `.el-p` and `.markdown-preview-section > div` after `MarkdownRenderer.render()`. CSS keeps the same compact rules as a fallback. Headings keep their Obsidian/theme font-size hierarchy while using compact block spacing inside the constrained caption panel.

## Plain Navigation Hardening

`src/render/navigationLayout.ts` was introduced during Phase 2 and completed in [[documentation/phase-3-top-navigation]]. It chooses the top navigation layout from item count and available width:

- `dots` while the current item oval, the remaining item dots, and the minimum `3px` gaps fit inside the navigation width;
- `rail` once that width is not enough or the gallery has more than `10` items.

The active item marker is always a fixed horizontal muted oval. In `dots` layout the other media items remain small circular buttons. In `rail` layout all circles are hidden and the same oval moves along an invisible horizontal rail; pointer drag and click map the rail position to the closest media index.

Plain navigation is rendered inside the media viewport and follows the same hover-only visibility model as viewport controls: it is hidden by default and appears on viewport hover or focus.

## Media Rotation

The current `grid: 1,1` renderer shows a hover-only rotate button in the bottom-right corner of the viewport. Each click rotates the current media clockwise by `90` degrees.

Rotation is stored in the corresponding caption note frontmatter:

```yaml
rotation: 90
```

Allowed runtime values are normalized to `0`, `90`, `180`, or `270` through modulo `360`. The future grid renderer should place the same rotate button inside each media cell and write rotation to each cell's own caption note.

## Markdown Links

`src/captions/captionMarkdownRenderer.ts` wraps `MarkdownRenderer.render(app, markdown, containerEl, sourcePath, component)` and then binds rendered `a.internal-link` elements manually:

- click opens the link through `app.workspace.openLinkText`;
- mouseover triggers `hover-link`;
- `source` uses the registered `obsidian-gallery-caption` hover source;
- `hoverParent` is the gallery component, so popovers follow the gallery lifecycle.

This is required because Obsidian does not automatically attach Reading mode link handlers inside custom gallery DOM.

## Parameter Names

Phase 2 renames the public code block options:

- `navigation: plain | preview` replaces the typo `navigation: plane`;
- `view: crop | fit` replaces `fit: cover | contain`.
- `view_height` controls the media viewport height and defaults to `400`;
- `caption_height` controls the caption panel height and defaults to `60`.

Temporary aliases keep old blocks readable: `plane -> plain`, `fit: cover -> view: crop`, `fit: contain -> view: fit`, and `height -> view_height`.

## Tests

Current unit coverage added in this phase:

- caption folder normalization;
- deterministic caption paths;
- different `gallery_id` namespaces;
- image/video target prefixes;
- frontmatter/body splitting for caption notes;
- caption note frontmatter creation;
- adaptive plain navigation layout selection.
