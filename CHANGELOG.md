# Changelog

All notable changes to Caption Gallery Slider are documented in this file.

## Unreleased

- Media with a panned crop now rotates around the viewport center; zoom still scales around the crop focus.
- The rotate transition always turns clockwise, including the step from 270 back to 0.
- Drag and WASD crop panning follow the screen after a quarter turn.
- Caption note paths are resolved case-insensitively against existing vault folders, so a gallery id that changed case keeps its caption notes and rotation no longer fails silently.
- Failed caption writes show a notice and roll the change back instead of leaving the gallery out of sync.

## 0.1.1

Maintenance release ahead of the Community Plugins submission. Gallery syntax and behavior are unchanged.

- Fixed every error reported by the official Obsidian ESLint rules.
- Dynamic styles are applied with `setCssProps` and `setCssStyles` instead of direct `style` writes.
- Timers use the window API for popout window compatibility.
- Gallery renderer callbacks are typed as function properties, and stored settings are typed instead of `any`.
- The "Video position" and "Insert caption" labels use sentence case.

## 0.1.0

Initial public release.

- Added `gallery` code block rendering for local image and video media.
- Added recursive folder scanning, explicit file lists, deduplication, and sorting.
- Added plain and preview navigation modes.
- Added editable Markdown captions stored as ordinary vault notes.
- Added internal link click and hover preview support inside rendered captions.
- Added custom video controls, playback state, fragment ranges, and looped fragments.
- Added fullscreen, crop/fit view modes, rotation, manual crop pan/zoom, and resize handles.
- Added responsive overlay controls for narrow popups and small viewports.
- Caption text follows the active theme and the reading mode of the note, so a
  caption reads like a line of the note it lives in.
- Requires Obsidian 1.6.6 or newer. Desktop only in this release.
