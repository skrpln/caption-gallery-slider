# Caption Placement

Related notes: [[expectation]], [[plan]], [[documentation/widget-size-controls]], [[documentation/phase-2-captions]], [[documentation/stylesheet-specificity]], [[progress_log]]

The caption panel can sit below, above, left, or right of the media. A side caption is meant for portrait media: the image keeps the full widget height and the text gets a readable column beside it.

## Syntax

```md
caption: right      # bottom | top | left | right | false   (default: bottom)
caption_size: 300   # caption panel thickness in px
```

- `caption: true` is an alias of `bottom`, so blocks written before placement existed keep working.
- `caption: false` hides the caption panel.
- An unknown value is an inline error that lists the allowed values.

`caption_size` is the panel **thickness**, the only caption dimension the user controls. The other dimension always follows the widget:

| Placement | `caption_size` sets | Follows the widget | Default |
| --- | --- | --- | --- |
| `bottom`, `top` | height | width = note width | `60` |
| `left`, `right` | width | height = `view_height` + arrows row | `300` |

The default depends on the placement only while `caption_size` is absent. An explicit value applies to whichever axis the placement uses, so switching `bottom` → `right` with `caption_size: 60` gives a side caption raised to its minimum width (see below).

Legacy `caption_height` keeps its literal meaning: it applies to `top` and `bottom` only and is ignored by side captions. `caption_size` wins when both are present. The first caption resize renames the `caption_height` line to `caption_size`.

## Layout

The arrows row always stays directly under the media.

```
bottom        top           left               right
[viewport]    [caption ]    [cap|viewport]     [viewport|cap]
[arrows  ]    [viewport]    [cap|arrows  ]     [arrows  |cap]
[caption ]    [arrows  ]
```

A side caption spans the viewport row and the arrows row and scrolls inside that height.

## Resize Handles

| Placement | Viewport handle (`view_height`) | Caption handle (`caption_size`) |
| --- | --- | --- |
| `bottom` | top edge of the viewport, drag up to grow | bottom edge of the caption, drag down to grow |
| `top` | bottom edge of the viewport, drag down to grow | top edge of the caption, drag up to grow |
| `left` | top edge of the viewport | right edge of the caption, drag right to grow |
| `right` | top edge of the viewport | left edge of the caption, drag left to grow |

Top and bottom handles sit on the outer edges of their panels. A side caption resizes from the edge it shares with the media, since the widget width is fixed by the note. Side handles use the `ew-resize` cursor; the drag sets `--og-cursor: ew-resize` on the root through `is-resizing-width`.

## Narrow Widgets

A side caption never squeezes the media below `MIN_SIDE_VIEW_WIDTH = 260px` and never gets narrower than `MIN_CAPTION_WIDTH = 180px`:

1. The rendered width is `caption_size` clamped to `[180, widget width − 260]`. The stored value is kept, so the caption grows back when the widget gets wider again (for example after leaving fullscreen).
2. When the widget is narrower than `180 + 260 = 440px`, the side caption moves to the bottom with the default height `60px`.
3. In this fallback the caption resize handle is hidden: a height dragged there would be saved as `caption_size` and become the side width once the widget is wide again.

A drag never triggers the fallback: the resolver clamps the drag at the same limits.

The rule ignores a width of `0`, which means the widget is not in the DOM yet; the requested side is kept until the first measurement.

## Hover Popover

A hover popover (page preview, `.hover-popover`) shows the gallery in the placement the note asks for. A side caption keeps its side at any popover width and takes exactly half of the widget; the media gets the other half. `caption_size` and the narrow-widget rule above do not apply there, and the caption resize handle is hidden for the same reason as in the fallback. Top and bottom captions keep `caption_size`.

The renderer checks `rootEl.closest(".hover-popover")` on every layout pass, because the popover inserts the rendered note after the gallery is built. `resolveCaptionLayout()` reports the source of the size as `mode`: `stored` (from `caption_size`, resizable), `fallback`, or `popover`; the root gets `is-caption-fixed` for the last two.

## Fullscreen

Fullscreen keeps the caption on its side. For `left` and `right` the grid rows become `minmax(0, 1fr) var(--og-control-size)`, so the viewport fills the screen height and the caption keeps its width.

## Implementation

| File | Role |
| --- | --- |
| `src/parser/galleryBlockParser.ts` | `GalleryCaption = "bottom" \| "top" \| "left" \| "right" \| false`; `captionSize` resolves `caption_size`, legacy `caption_height`, and the per-axis default. |
| `src/render/captionPlacement.ts` | Pure helpers. `resolveCaptionLayout(placement, size, widgetWidth, inPopover)` returns the rendered placement, size, and mode (`stored`, `fallback`, `popover`). `resizeHandleDelta(option, placement, dx, dy)` turns pointer movement into a size change. |
| `src/parser/galleryBlockEditor.ts` | `caption_size` source updates; renames `caption_height` like `height` → `view_height`. |
| `src/render/GalleryRenderer.ts` | `updateCaptionLayout()` toggles one `og-gallery--caption-*` class, `is-caption-fixed`, and `--og-caption-size` on the root. `observeWidgetSize()` watches the root (placement) and the viewport (navigation layout, overlay controls, quarter-rotation box), because a side caption changes the viewport width without changing the root width. The observer is created by the gallery's own window, see [[documentation/popout-windows]]. |
| `styles.css` | Bottom is the base flex column; `top` sets `order: -1` on the caption; `left`/`right` switch the root to a grid with `grid-template-areas`. |

The top navigation measures the viewport instead of the root, so dots, rail, and preview thumbnails fit the narrower viewport of a side layout.

## Tests

- `src/render/captionPlacement.test.ts`: axis clamps, minimum side width, shrinking to keep the media width, fallback threshold, unmeasured widget, half split in a hover popover, handle directions.
- `src/parser/galleryBlockParser.test.ts`: every placement, `true`/`false`, normalization, per-axis defaults, `caption_size`, legacy `caption_height`, errors.
- `src/parser/galleryBlockEditor.test.ts`: `caption_size` replace, insert, and `caption_height` rename.

The layout was also checked in a browser stand that bundles the real `GalleryRenderer` with a stub of the `obsidian` module (`MarkdownRenderChild`, `setIcon`, `setTooltip`, `Keymap`) and the global DOM helpers (`createDiv`, `createEl`, `createSpan`, `empty`, `setCssProps`, `setCssStyles`). The page needs `box-sizing: border-box` on all elements, as in Obsidian's `app.css`. Fullscreen cannot be requested inside the embedded browser pane, so it is checked in Obsidian.
