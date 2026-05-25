# Architecture

Related notes: [[plan]], [[expectation]], [[documentation/_MOC]]

## Goal

`obsidian-gallery` should feel like a native Obsidian feature: small DOM surface, theme-aware styles, predictable behavior in Reading mode, Live Preview, and hover pop-ups.

The first implementation should avoid a frontend framework. Plain TypeScript, Obsidian APIs, and small isolated modules are enough for the required UI and keep the bundle light.

## Layer Boundaries

| Layer | Owns | Does not own |
| --- | --- | --- |
| Plugin entry | Obsidian lifecycle, settings, code block processor registration | Parsing details, DOM rendering details |
| Parser | Text-to-config conversion, validation messages | Vault reads, DOM |
| Media resolver | Vault lookup, media file filtering, sorting, deduplication | UI state, rendering |
| Gallery state | Current index/page, next/previous/goTo transitions | File system and DOM |
| Renderer | DOM nodes, event listeners, visual state updates | Vault scanning, caption path rules |
| Caption service | Caption paths, lazy creation, frontmatter/body handling | Navigation UI |
| Markdown integration | Markdown rendering, internal link click binding, hover preview trigger | Caption file IO, gallery navigation |

## Data Flow

```text
gallery code block
  -> parser
  -> validation result
  -> media resolver
  -> GalleryItem[]
  -> gallery state
  -> renderer
  -> caption service (Phase 2+)
  -> markdown integration (Phase 2+)
```

## Module Shape

Suggested `src/` layout:

```text
src/
  main.ts
  parser/
  media/
  state/
  render/
  captions/
  settings/
```

Keep pure modules free from Obsidian imports when possible. Parser, gallery state, hash/path helpers, and navigation mode selection should run in unit tests without an Obsidian app instance.

## Rendering Strategy

The renderer should create a stable widget shell once and mutate only the parts that change:

- current media source;
- active navigation marker;
- caption content;
- disabled or loading states.

Use Obsidian CSS variables for color, border, radius, and typography. User-facing errors should render inline inside the widget.

## Cleanup

Every DOM listener, pointer handler, timer, observer, and vault event subscription must be registered through an Obsidian `Component` or an equivalent cleanup path owned by the markdown post processor context.

## Captions

Captions are ordinary markdown files. The gallery should never treat the code block as caption storage. This keeps captions searchable, linkable, and compatible with Obsidian hover preview.

Caption files are created lazily on first edit, not during initial render.

## Markdown Links and Hover Preview

`MarkdownRenderer.render(app, markdown, containerEl, sourcePath, component)` renders internal links with the expected Obsidian classes and attributes, but custom gallery DOM does not automatically receive Reading mode click and hover handlers. This is a known Obsidian behavior for custom views: https://forum.obsidian.md/t/internal-links-dont-work-in-custom-view/90169

Phase 2 must include a dedicated markdown integration helper, for example `renderCaptionMarkdown`, with these responsibilities:

- call `MarkdownRenderer.render()` with the caption note path as `sourcePath`;
- pass the owning `Component` so Obsidian can attach child components and cleanups correctly;
- after render, query `a.internal-link`;
- bind click events to `app.workspace.openLinkText(linktext, sourcePath, Keymap.isModEvent(evt))`;
- bind mouseover events to `app.workspace.trigger("hover-link", { ... })`;
- pass `hoverParent: component` so popovers follow the gallery lifecycle;
- use a stable plugin hover source id, for example `obsidian-gallery-caption`;
- register that source during plugin `onload()` via `registerHoverLinkSource`.

This is required for captions to behave like normal Obsidian markdown inside a custom renderer. If hover preview fails during debugging, temporarily using `source: "preview"` can isolate whether the issue is source registration or event payload shape.

## Testing Strategy

Unit tests should cover:

- parser behavior;
- config validation;
- media type detection;
- sort and deduplication;
- gallery state transitions;
- caption path generation;
- frontmatter/body parsing;
- internal-link binding around rendered caption markdown.

DOM rendering can be tested later with jsdom smoke tests, but the first priority is pure logic.
