# 2026-06-03 04:04 — Manual Crop Controls

Связанные заметки: [[plan]], [[progress_log]], [[documentation/crop-controls]], [[documentation/keyboard-navigation-backlog]]

## Сделано

- Phase 5 актуализирована как этап правок и pre-release доработок; `grid != 1,1` и крупные новые фичи вынесены в [[plan#Feature Backlog]].
- Добавлена настройка области `view: crop`:
  - `crop_x`, `crop_y`, `crop_zoom` читаются и сохраняются во frontmatter caption-заметки;
  - long-press drag в viewport через `1000 ms` активирует pan видимой области;
  - trackpad pinch через browser wheel gesture меняет zoom;
  - hover-only кнопки `+`, `-`, `rotate` расположены справа снизу в одном action row;
  - `ArrowUp` / `ArrowDown` соответствуют zoom in / zoom out;
  - WASD смещает crop area активной галереи.
- Добавлен pure-helper `src/captions/captionCrop.ts` и unit-тесты `src/captions/captionCrop.test.ts`.
- Caption frontmatter helpers дополнены `readCrop()` и `upsertCrop()`.
- `ObsidianCaptionService.saveCrop()` создаёт или обновляет caption note без изменения body.
- Renderer применяет crop через `object-position`, `transform-origin` и `--og-media-crop-zoom`.
- Keyboard routing расширен:
  - WASD работает по physical `KeyboardEvent.code`, включая русскую раскладку;
  - listener переведён в capture-фазу, чтобы Obsidian editor не перехватывал буквенные клавиши раньше галереи;
  - caption editing остаётся защищённым от перехвата WASD и arrows.
- Отключён native browser drag для `<img>` и `<video>`, который мешал pan изображений.
- Cursor states разделены:
  - long-press drag использует grabbing cursor;
  - zoom жестом тачпада использует four-way move cursor;
  - кнопки `+` / `-` остаются обычными button controls.
- Добавлена документация [[documentation/crop-controls]]; обновлены [[documentation/_MOC]], [[plan]], [[progress_log]].
- Собранный плагин обновлён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`.

## Проверки

- `npm test` — 72 теста, успешно.
- `npm run build` — успешно.
- `git diff --check` — без замечаний.
- Ручная приёмка оператором успешна:
  - кнопки `+` / `-` отображаются и работают корректно;
  - long-press drag принят после исправления native image drag;
  - WASD заработал после перехода на physical key codes;
  - `ArrowUp` / `ArrowDown` добавлены и приняты как keyboard zoom.

## Сложности

- `<img>` запускал native browser drag, из-за чего появлялись системные file-drag tooltip и зелёный plus marker, а pan не доходил до renderer.
- Обычный `KeyboardEvent.key` не подходил для WASD при русской раскладке; нужен `KeyboardEvent.code`.
- Bubble-фаза keyboard listener могла проигрывать Obsidian/CodeMirror, поэтому обработчик перенесён в capture-фазу.
- `object-position` сам по себе даёт движение только по axis, где исходный `object-fit: cover` создаёт overflow; для zoom-перемещения по обеим плоскостям добавлен `transform-origin`.

## Следующие шаги

- Продолжить Phase 5 как стабилизацию текущего single-slide scope.
- После накопления оставшихся pre-release правок перейти к Phase 6: formal release and publication.
