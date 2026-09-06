# Crop Controls

Связанные заметки: [[plan]], [[documentation/architecture]], [[documentation/phase-2-captions]], [[documentation/keyboard-navigation-backlog]]

Phase 5 добавляет ручную настройку видимой области для `view: crop`. Автоматический `object-fit: cover` остаётся дефолтом, но пользователь может сместить crop anchor и увеличить media внутри viewport.

## Caption frontmatter

Crop state хранится в caption note каждого media item:

```yaml
crop_x: 50
crop_y: 50
crop_zoom: 1
```

- `crop_x` и `crop_y` — normalized anchor в диапазоне `0..100`.
- `crop_zoom` — scale в диапазоне `1..4`.
- Если caption note ещё не существует, первое изменение crop создаёт её через тот же lazy lifecycle, что rotation и video playback state.
- Если caption storage не настроен, crop применяется только в текущем render lifecycle и не сохраняется.

## Interaction model

- Long-press drag: удержание левой кнопки мыши или тачпада в viewport в течение `1000 ms` активирует pan mode. После активации drag смещает изображение, а состояние сохраняется после отпускания. Native browser drag для `<img>` и `<video>` отключён, чтобы Obsidian/browser не подменяли жест системным перетаскиванием файла.
- WASD: активная галерея принимает `W`, `A`, `S`, `D` как pan вверх, влево, вниз и вправо. Caption editing блокирует перехват этих клавиш.
- Trackpad pinch: browser wheel gesture с `ctrlKey` масштабирует crop area и не запускает перелистывание галереи.
- Buttons: hover-only `zoom in`, `zoom out`, `rotate` расположены справа снизу в viewport. `+` и `-` имеют тот же размер и визуальную модель, что rotate.
- Pan учитывает поворот: drag и WASD двигают картинку в экранных направлениях. `rotateCropDelta()` переводит движение в оси media element, для `90` и `270` градусов оси меняются местами, а размеры box берутся как viewport height x width.

Cursor states:
- zoom жестами тачпада использует four-way move cursor на viewport/media;
- `+` / `-` остаются обычными button controls с pointer cursor;
- long-press drag использует grabbing cursor после активации через `1000 ms`.

## Implementation

- Pure crop math живёт в `src/captions/captionCrop.ts`.
- Frontmatter helpers `readCrop()` и `upsertCrop()` живут в `src/captions/captionMarkdown.ts`.
- `ObsidianCaptionService.saveCrop()` создаёт или обновляет caption note без изменения body.
- `GalleryRenderer` применяет crop через `object-position` и CSS variables `--og-media-crop-zoom`, `--og-media-focus-x`, `--og-media-focus-y`. `object-position` управляет исходной `object-fit: cover` областью. Zoom масштабируется вокруг точки фокуса (`crop_x`, `crop_y`): в CSS это `translate(focus) scale(zoom) translate(-focus)` при `transform-origin: center`. Поворот стоит перед этой цепочкой и всегда идёт вокруг центра media box, поэтому повёрнутое media остаётся в центре viewport при любом crop.
- До 0.1.2 код ставил `transform-origin` в crop anchor. Поворот тогда происходил вокруг смещённой точки, и при `crop_x`/`crop_y` не равных `50` media уезжало за края viewport, оставляя пустую область.
- Plugin-level keyboard routing остаётся централизованным: `src/main.ts` сначала обрабатывает Arrow navigation, затем передаёт WASD активному renderer через `panCropFromKeyboard()`.

## Test coverage

- `src/captions/captionCrop.test.ts` проверяет normalization, pan, zoom math и перевод pan в оси media при повороте.
- `src/captions/captionMarkdown.test.ts` проверяет чтение и запись `crop_x`, `crop_y`, `crop_zoom`.
- `src/render/keyboardNavigation.test.ts` проверяет WASD routing и блокировку во время text editing.
