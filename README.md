# Obsidian Gallery

Obsidian Gallery is an Obsidian plugin that renders fenced `gallery` code blocks as native-feeling image galleries.

## Current MVP

- `gallery` code block processor.
- Image galleries from `dir`, `list`, or both.
- Recursive folder scanning.
- Deduplication by vault path.
- Unified sorting by `name`, `created`, or `modified`.
- Single-image viewport for `grid: 1,1`.
- Previous/next buttons, dots, and basic swipe navigation.
- Inline validation and empty-state messages.

## Example

````markdown
```gallery
gallery_id: vacation
dir: Attachments/vacation_2026
list:
  - Attachments/special.png
sort: name
grid: 1,1
view_height: 400
caption_height: 60
navigation: plain
view: crop
```
````

## Development

```bash
npm install
npm test
npm run build
```

Built plugin files are `main.js`, `manifest.json`, and `styles.css`.
