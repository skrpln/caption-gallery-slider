# Overlay Controls Layout

Связанные заметки: [[plan]], [[documentation/phase-4-video]], [[documentation/crop-controls]]

Phase 5 добавляет responsive layout для controls поверх media viewport. Цель — сохранить управление видео и crop в hover pop-up, но не загромождать маленькую область демонстрации.

## Layout modes

Renderer выбирает layout по фактическим размерам viewport:

| Mode | Поведение |
| ---- | --------- |
| `normal` | Video buttons, video progress и crop/rotate buttons находятся в одной нижней строке. |
| `compact` | В первой строке video buttons слева и crop/rotate buttons справа; во второй строке video progress. |
| `ultra` | Три строки: video buttons, crop/rotate buttons, video progress. |
| `hidden` | Overlay controls и progress скрыты полностью. |

`hidden` включается, если controls заняли бы больше `60%` высоты viewport или если минимальная ширина control row не помещается.

## Implementation

- Pure selection logic живёт в `src/render/overlayControlsLayout.ts`.
- `GalleryRenderer` собирает единый `.og-gallery__overlay-controls` layer внутри viewport.
- CSS grid раскладывает соседние элементы:
  - `.og-gallery__video-controls`;
  - `.og-gallery__media-actions`;
  - `.og-gallery__video-progress`.
- `ResizeObserver` на viewport пересчитывает mode при изменении размера popup, fullscreen или `view_height`.

## Test coverage

`src/render/overlayControlsLayout.test.ts` проверяет:
- wide viewport → `normal`;
- standard popup width → `compact`;
- very narrow viewport → `ultra`;
- controls height > `60%` viewport → `hidden`;
- insufficient width → `hidden`.
