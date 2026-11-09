# Caption Gallery Slider

Caption Gallery Slider is an Obsidian plugin for turning a fenced `gallery` code block into a native-feeling media slider for local images and videos.

Its main idea is simple: keep media in your vault, keep captions as ordinary Markdown notes, and edit those captions directly inside the gallery.

This release is desktop only. The interface relies on hover controls and pointer input, so mobile support is planned for a later version, after dedicated touch testing.

## Features

- Local image and video galleries from a folder, an explicit file list, or both.
- Editable Markdown captions stored as regular vault notes.
- Internal links and hover previews inside rendered captions.
- Preview thumbnails, plain dot navigation, and adaptive slider navigation.
- Video playback controls with play, mute, loop, progress, and saved fragment ranges.
- `crop` and `fit` view modes, rotation, manual crop pan/zoom, and fullscreen view.
- Caption panel below, above, left, or right of the media; a side caption suits portrait images.
- Resize handles for the media viewport and caption panel.
- Theme-aware UI based on Obsidian CSS variables.

## Basic Syntax

````markdown
```gallery
gallery_id: vacation
dir: Attachments/vacation_2026
list:
  - Attachments/special.png
sort: name
navigation: preview
view: crop
view_height: 420
caption: bottom
caption_size: 96
```
````

`gallery_id` is required. It is used as the namespace for caption notes, so the same media file can have different captions in different galleries.

At least one media source is required:

- `dir`: scans a vault folder recursively.
- `list`: adds explicit vault paths.
- both sources can be used together.

## Options

| Option | Values | Default | Description |
| --- | --- | --- | --- |
| `gallery_id` | text | required | Caption namespace for this gallery. |
| `dir` | vault folder path | none | Recursively scans supported media files. |
| `list` | YAML-style list | none | Adds explicit vault media paths. |
| `sort` | `name`, `created`, `modified` | `name` | Sorts the combined media set. |
| `navigation` | `plain`, `preview` | `plain` | Selects top navigation style. |
| `view` | `crop`, `fit` | `crop` | Controls how media fits the viewport. |
| `view_height` | number | plugin default | Media viewport height in pixels. |
| `caption` | `bottom`, `top`, `left`, `right`, `false` | `bottom` | Places or hides the caption panel. `true` means `bottom`. |
| `caption_size` | number | `60` for `bottom`/`top`, `300` for `left`/`right` | Caption panel thickness in pixels: height for `bottom`/`top`, width for `left`/`right`. |

The other caption dimension follows the gallery: a bottom or top caption is as wide as the note, a side caption is as tall as the media and the arrows. A side caption needs a gallery at least 440 px wide; in a narrower one, such as a hover preview, it moves below the media. The older `caption_height` option still sets the height of a bottom or top caption.

## Caption Notes

Captions are not stored inside the code block. Caption Gallery Slider creates Markdown notes lazily when you first edit a caption.

By default, the caption folder is configured in:

`Settings > Community plugins > Caption Gallery Slider > Caption folder`

Each caption note contains frontmatter for gallery metadata and optional media state, followed by a normal Markdown body. This means captions can include:

- `[[internal links]]`
- formatted text
- lists
- headings
- backlinks and search results like regular notes

## Supported Media

Images:

- `jpg`
- `jpeg`
- `png`
- `gif`
- `webp`
- `svg`

Videos:

- `mp4`
- `avi`
- `mov`
- `webm`

Caption Gallery Slider currently works with local vault files. Remote image URLs, remote videos, YouTube embeds, grid layouts, slideshow autoplay, and audio support are planned as future work.

## Support

Please report bugs through GitHub Issues:

https://github.com/skrpln/caption-gallery-slider/issues

Useful bug reports include:

- Obsidian version and operating system.
- Plugin version.
- Whether the issue happens in Reading mode, Live Preview, fullscreen, or hover preview.
- A small `gallery` code block that reproduces the issue.
- Console errors, if any.

## License

MIT. See [LICENSE](LICENSE).
