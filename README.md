# Caption Gallery Slider

Caption Gallery Slider is an Obsidian plugin for turning a fenced `gallery` code block into a native-feeling media slider for local images and videos.

Its main idea is simple: keep media in your vault, keep captions as ordinary Markdown notes, and edit those captions directly inside the gallery.

> Demo GIF and short videos will be added before the public beta announcement.

## Features

- Local image and video galleries from a folder, an explicit file list, or both.
- Editable Markdown captions stored as regular vault notes.
- Internal links and hover previews inside rendered captions.
- Preview thumbnails, plain dot navigation, and adaptive slider navigation.
- Video playback controls with play, mute, loop, progress, and saved fragment ranges.
- `crop` and `fit` view modes, rotation, manual crop pan/zoom, and fullscreen view.
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
caption_height: 96
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
| `caption_height` | number | plugin default | Caption panel height in pixels. |
| `caption` | `true`, `false` | `true` | Shows or hides the caption panel. |

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

## Installation

### Manual install

1. Download the latest release assets from GitHub.
2. Copy `main.js`, `manifest.json`, and `styles.css` into:

   ```text
   <your-vault>/.obsidian/plugins/caption-gallery-slider/
   ```

3. Reload Obsidian.
4. Enable `Caption Gallery Slider` in Community plugins.

### BRAT beta

Before the plugin is accepted into the official Community Plugins directory, beta testers can install it with [BRAT](https://github.com/TfTHacker/obsidian42-brat).

1. Install and enable BRAT.
2. Open BRAT settings.
3. Add this repository:

   ```text
   https://github.com/skrpln/caption-gallery-slider
   ```

4. Let BRAT download the release assets.
5. Enable `Caption Gallery Slider` in Community plugins.

## Development

```bash
npm install
npm test
npm run build
```

The production build outputs:

- `main.js`
- `manifest.json`
- `styles.css`

GitHub release tags must match `manifest.json.version` exactly, for example `0.1.0`.

## Privacy

Caption Gallery Slider is designed for local vault media. It does not use telemetry, analytics, or background network requests.

If future remote media support is added, it will be documented clearly because rendering remote media requires network requests.

## Limitations

- The first public release focuses on single-slide galleries. Grid layouts are planned later.
- Mobile support still needs dedicated testing before the official submission.
- Captions are created only after the first edit, so an empty placeholder does not create files by itself.
- Very large videos depend on Obsidian and the operating system media stack.

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
